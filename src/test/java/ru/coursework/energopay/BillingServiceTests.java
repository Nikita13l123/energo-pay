package ru.coursework.energopay;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;
import ru.coursework.energopay.auth.RegisterRequest;
import ru.coursework.energopay.billing.BillingService;
import ru.coursework.energopay.user.UserService;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BillingServiceTests {
    @Autowired BillingService billing;
    @Autowired UserService users;

    @Test
    void manualBillUsesPreviousValueAndKeepsItsTariff() {
        long userId = users.register(new RegisterRequest("Клиент", UUID.randomUUID() + "@example.test", "Test-pass-123")).getId();
        var first = billing.manualBill(userId, YearMonth.now().minusMonths(1).toString(), 120, new BigDecimal("5.25"));
        assertEquals(0, first.previousValue());
        assertEquals(0, new BigDecimal("630.00").compareTo(first.amount()));
        var next = billing.submitReading(userId, 150);
        assertEquals(120, next.previousValue());
        assertEquals(30, next.consumption());
        assertEquals(0, new BigDecimal("5.25").compareTo(billing.bill(userId, first.id()).tariff()));
        assertThrows(ResponseStatusException.class, () -> billing.manualBill(userId, YearMonth.now().toString(), 151, new BigDecimal("5.25")));
    }

    @Test
    void tariffChangeAffectsOnlyNewBills() {
        var original = billing.tariff();
        try {
            billing.updateTariff(new BigDecimal("7.31"));
            long userId = users.register(new RegisterRequest("Клиент", UUID.randomUUID() + "@example.test", "Test-pass-123")).getId();
            var bill = billing.submitReading(userId, 100);
            billing.updateTariff(new BigDecimal("8.00"));
            assertEquals(0, new BigDecimal("731.00").compareTo(billing.bill(userId, bill.id()).amount()));
            assertEquals(0, new BigDecimal("7.31").compareTo(billing.bill(userId, bill.id()).tariff()));
        } finally {
            billing.updateTariff(original);
        }
    }
}
