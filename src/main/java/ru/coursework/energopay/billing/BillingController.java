package ru.coursework.energopay.billing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class BillingController {
    private final BillingService billing;

    public BillingController(BillingService billing) {
        this.billing = billing;
    }

    public record ReadingRequest(@Min(1) @Max(999999999) long value) {}
    public record PaymentRequest(@NotNull Boolean simulateFailure) {}
    public record TariffRequest(@NotNull @DecimalMin("0.01") @DecimalMax("99999.99") @Digits(integer = 5, fraction = 2) BigDecimal tariff) {}
    public record ManualBillRequest(@Min(1) long userId, @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}") String period,
                                    @Min(1) @Max(999999999) long currentValue,
                                    @NotNull @DecimalMin("0.01") @DecimalMax("99999.99") @Digits(integer = 5, fraction = 2) BigDecimal tariff) {}

    @GetMapping("/account")
    public BillingService.Account account(Authentication auth) {
        return billing.account(billing.userId(auth.getName()));
    }

    @GetMapping("/readings")
    public List<BillingService.Reading> readings(Authentication auth) {
        return billing.readings(billing.userId(auth.getName()));
    }

    @PostMapping("/readings")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public BillingService.Bill submitReading(Authentication auth, @Valid @RequestBody ReadingRequest body) {
        return billing.submitReading(billing.userId(auth.getName()), body.value());
    }

    @GetMapping("/bills")
    public List<BillingService.Bill> bills(Authentication auth, @RequestParam(required = false) String status,
                                          @RequestParam(required = false) LocalDate from,
                                          @RequestParam(required = false) LocalDate to) {
        return billing.bills(billing.userId(auth.getName()), status, from, to);
    }

    @GetMapping("/bills/{id}")
    public BillingService.Bill bill(Authentication auth, @PathVariable long id) {
        return billing.bill(billing.userId(auth.getName()), id);
    }

    @PostMapping("/bills/{id}/payments")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public BillingService.Payment pay(Authentication auth, @PathVariable long id, @Valid @RequestBody PaymentRequest body) {
        return billing.pay(billing.userId(auth.getName()), id, body.simulateFailure());
    }

    @GetMapping("/payments")
    public List<BillingService.Payment> payments(Authentication auth) {
        return billing.payments(billing.userId(auth.getName()));
    }

    @GetMapping("/staff/clients")
    public List<BillingService.Client> clients() {
        return billing.clients();
    }

    @GetMapping("/staff/bills")
    public List<BillingService.Bill> clientBills(@RequestParam long userId) {
        return billing.bills(userId, null, null, null);
    }

    @PostMapping("/staff/bills")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public BillingService.Bill manualBill(@Valid @RequestBody ManualBillRequest body) {
        return billing.manualBill(body.userId(), body.period(), body.currentValue(), body.tariff());
    }

    @PutMapping("/staff/tariff")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void tariff(@Valid @RequestBody TariffRequest body) {
        billing.updateTariff(body.tariff());
    }
}
