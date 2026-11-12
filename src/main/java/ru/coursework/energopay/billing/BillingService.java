package ru.coursework.energopay.billing;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class BillingService {
    private final JdbcTemplate jdbc;

    public BillingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Account(long userId, long lastReading, BigDecimal tariff, BigDecimal balance) {}
    public record Reading(long id, String period, long previousValue, long currentValue,
                          long consumption, LocalDateTime createdAt) {}
    public record Bill(long id, long userId, String period, long previousValue, long currentValue,
                       long consumption, BigDecimal tariff, BigDecimal amount, String status,
                       LocalDateTime createdAt) {}
    public record Payment(long id, long billId, BigDecimal amount, String status, LocalDateTime createdAt) {}
    public record Client(long id, String fio, String email) {}

    public long userId(String email) {
        return jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
    }

    public Account account(long userId) {
        Long last = jdbc.queryForObject("SELECT COALESCE(MAX(current_value), 0) FROM bills WHERE user_id = ?", Long.class, userId);
        BigDecimal balance = jdbc.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM bills WHERE user_id = ? AND status = 'UNPAID'", BigDecimal.class, userId);
        return new Account(userId, last, tariff(), balance);
    }

    public BigDecimal tariff() {
        return jdbc.queryForObject("SELECT tariff FROM billing_settings WHERE id = 1", BigDecimal.class);
    }

    public List<Reading> readings(long userId) {
        return jdbc.query("SELECT * FROM readings WHERE user_id = ? ORDER BY id DESC", (rs, row) ->
                new Reading(rs.getLong("id"), rs.getString("period"), rs.getLong("previous_value"),
                        rs.getLong("current_value"), rs.getLong("current_value") - rs.getLong("previous_value"),
                        rs.getTimestamp("created_at").toLocalDateTime()), userId);
    }

    public List<Bill> bills(long userId, String status, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) badRequest("Дата начала позже даты окончания");
        if (status != null && !List.of("UNPAID", "PAID").contains(status)) badRequest("Неизвестный статус счёта");
        // Fixed SQL and bound parameters keep filter values out of the query text.
        return jdbc.query("""
                SELECT * FROM bills WHERE user_id = ?
                AND (? = '' OR status = ?)
                AND created_at >= ? AND created_at < ? ORDER BY id DESC
                """, this::mapBill, userId, status == null ? "" : status, status == null ? "" : status,
                (from == null ? LocalDate.of(2000, 1, 1) : from).atStartOfDay(),
                (to == null ? LocalDate.of(9998, 12, 31) : to).plusDays(1).atStartOfDay());
    }

    public Bill bill(long userId, long id) {
        return jdbc.query("SELECT * FROM bills WHERE id = ? AND user_id = ?", this::mapBill, id, userId)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Счёт не найден"));
    }

    @Transactional
    public Bill submitReading(long userId, long value) {
        lockClient(userId);
        return createBill(userId, YearMonth.now().toString(), value, tariff(), true);
    }

    @Transactional
    public Bill manualBill(long userId, String period, long currentValue, BigDecimal tariff) {
        lockClient(userId);
        YearMonth parsed;
        try {
            parsed = YearMonth.parse(period);
        } catch (java.time.format.DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Период должен иметь формат ГГГГ-ММ");
        }
        if (parsed.isAfter(YearMonth.now())) badRequest("Нельзя выставить счёт за будущий период");
        return createBill(userId, period, currentValue, tariff, false);
    }

    private Bill createBill(long userId, String period, long value, BigDecimal tariff, boolean withReading) {
        String latest = jdbc.queryForObject("SELECT MAX(period) FROM bills WHERE user_id = ?", String.class, userId);
        if (latest != null && period.compareTo(latest) <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "За этот или более поздний период уже выставлен счёт");
        }
        long previous = account(userId).lastReading();
        if (value <= previous || value > 999999999L) badRequest("Показания должны быть больше предыдущих и не превышать 999999999");
        BigDecimal amount = BigDecimal.valueOf(value - previous).multiply(tariff).setScale(2, RoundingMode.HALF_UP);
        Long readingId = null;
        if (withReading) {
            readingId = jdbc.queryForObject("INSERT INTO readings (user_id, period, previous_value, current_value) VALUES (?, ?, ?, ?) RETURNING id",
                    Long.class, userId, period, previous, value);
        }
        Long billId = jdbc.queryForObject("""
                INSERT INTO bills (user_id, reading_id, period, previous_value, current_value, tariff, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, Long.class, userId, readingId, period, previous, value, tariff, amount);
        return bill(userId, billId);
    }

    private void lockClient(long userId) {
        var clients = jdbc.queryForList("SELECT id FROM users WHERE id = ? AND role = 'CLIENT' FOR UPDATE", Long.class, userId);
        if (clients.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Клиент не найден");
    }

    public List<Payment> payments(long userId) {
        return jdbc.query("SELECT p.* FROM payments p JOIN bills b ON b.id = p.bill_id WHERE b.user_id = ? ORDER BY p.id DESC", this::mapPayment, userId);
    }

    @Transactional
    public Payment pay(long userId, long billId, boolean simulateFailure) {
        // The row lock serializes competing payments, including requests from different sessions.
        var bills = jdbc.query("SELECT * FROM bills WHERE id = ? AND user_id = ? FOR UPDATE", this::mapBill, billId, userId);
        Bill bill = bills.stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Счёт не найден"));
        if (bill.status().equals("PAID")) throw new ResponseStatusException(HttpStatus.CONFLICT, "Счёт уже оплачен");
        String status = simulateFailure ? "FAILED" : "SUCCESS";
        Long id = jdbc.queryForObject("INSERT INTO payments (bill_id, amount, status) VALUES (?, ?, ?) RETURNING id",
                Long.class, billId, bill.amount(), status);
        if (!simulateFailure) jdbc.update("UPDATE bills SET status = 'PAID' WHERE id = ?", billId);
        return jdbc.queryForObject("SELECT * FROM payments WHERE id = ?", this::mapPayment, id);
    }

    public List<Client> clients() {
        return jdbc.query("SELECT id, fio, email FROM users WHERE role = 'CLIENT' ORDER BY id", (rs, row) ->
                new Client(rs.getLong("id"), rs.getString("fio"), rs.getString("email")));
    }

    @Transactional
    public void updateTariff(BigDecimal value) {
        jdbc.update("UPDATE billing_settings SET tariff = ? WHERE id = 1", value);
    }

    private Bill mapBill(ResultSet rs, int row) throws SQLException {
        return new Bill(rs.getLong("id"), rs.getLong("user_id"), rs.getString("period"),
                rs.getLong("previous_value"), rs.getLong("current_value"),
                rs.getLong("current_value") - rs.getLong("previous_value"), rs.getBigDecimal("tariff"),
                rs.getBigDecimal("amount"), rs.getString("status"), rs.getTimestamp("created_at").toLocalDateTime());
    }

    private Payment mapPayment(ResultSet rs, int row) throws SQLException {
        return new Payment(rs.getLong("id"), rs.getLong("bill_id"), rs.getBigDecimal("amount"),
                rs.getString("status"), rs.getTimestamp("created_at").toLocalDateTime());
    }

    private void badRequest(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
