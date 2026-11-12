import concurrent.futures
import http.cookiejar
import json
import os
import unittest
import urllib.error
import urllib.request
import uuid

BASE_URL = os.environ.get('BASE_URL', 'http://127.0.0.1:8081')


class Client:
    def __init__(self):
        self.cookies = http.cookiejar.CookieJar()
        self.http = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))

    def request(self, method, path, body=None, csrf=True):
        headers = {'Content-Type': 'application/json'}
        if method not in ('GET', 'HEAD') and csrf:
            code, token = self.request('GET', '/api/auth/csrf')
            assert code == 200, (code, token)
            headers[token['headerName']] = token['token']
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
        try:
            response = self.http.open(request, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        text = response.read().decode()
        try:
            result = json.loads(text) if text else None
        except json.JSONDecodeError:
            result = text
        return response.status, result

    def register(self):
        email = f'{uuid.uuid4().hex}@example.test'
        body = {'fio': 'Тестовый клиент', 'email': email, 'password': 'Test-pass-123'}
        code, user = self.request('POST', '/api/auth/register', body)
        assert code == 201, (code, user)
        self.credentials = {'email': email, 'password': body['password']}
        code, user = self.request('POST', '/api/auth/login', self.credentials)
        assert code == 200, (code, user)
        return user


class BillingSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = Client()
        self.user = self.client.register()

    def make_bill(self, value=100):
        code, bill = self.client.request('POST', '/api/readings', {'value': value})
        self.assertEqual(code, 201, bill)
        return bill

    def test_registration_validation_and_role(self):
        self.assertEqual(self.user['role'], 'CLIENT')
        self.assertNotIn('passwordHash', self.user)
        status, _ = self.client.request('POST', '/api/auth/register', {
            'fio': 'Другой клиент', 'email': self.user['email'].upper(), 'password': 'Test-pass-123', 'role': 'EMPLOYEE',
        })
        self.assertEqual(status, 409)
        status, _ = self.client.request('POST', '/api/auth/register', {
            'fio': '', 'email': 'not-email', 'password': '123',
        })
        self.assertEqual(status, 400)

    def test_authentication_csrf_and_logout(self):
        stranger = Client()
        self.assertEqual(stranger.request('GET', '/api/account')[0], 401)
        self.assertEqual(stranger.request('POST', '/api/auth/login', {
            'email': self.user['email'], 'password': 'incorrect',
        })[0], 401)
        self.assertEqual(stranger.request('POST', '/api/auth/register', {}, csrf=False)[0], 403)
        self.assertEqual(self.client.request('GET', '/api/auth/me')[0], 200)
        self.assertEqual(self.client.request('POST', '/api/auth/logout')[0], 204)
        self.assertEqual(self.client.request('GET', '/api/auth/me')[0], 401)

    def test_bill_calculation_and_duplicate_reading(self):
        bill = self.make_bill(123)
        self.assertEqual(bill['consumption'], 123)
        self.assertAlmostEqual(bill['amount'], round(123 * bill['tariff'], 2))
        self.assertEqual(bill['previousValue'], 0)
        self.assertEqual(bill['status'], 'UNPAID')
        self.assertEqual(self.client.request('POST', '/api/readings', {'value': 124})[0], 409)
        readings = self.client.request('GET', '/api/readings')[1]
        self.assertEqual(len(readings), 1)
        self.assertEqual(readings[0]['currentValue'], 123)

    def test_invalid_readings(self):
        for value in (0, -1, 1.5, 1000000000):
            self.assertEqual(self.client.request('POST', '/api/readings', {'value': value})[0], 400)
        self.assertEqual(self.client.request('GET', '/api/readings')[1], [])

    def test_failure_retry_receipt_and_history(self):
        bill = self.make_bill()
        path = f"/api/bills/{bill['id']}/payments"
        code, failed = self.client.request('POST', path, {'simulateFailure': True})
        self.assertEqual(code, 201)
        self.assertEqual(failed['status'], 'FAILED')
        self.assertEqual(self.client.request('GET', f"/api/bills/{bill['id']}")[1]['status'], 'UNPAID')
        code, paid = self.client.request('POST', path, {'simulateFailure': False, 'amount': 0.01})
        self.assertEqual(code, 201)
        self.assertEqual(paid['amount'], bill['amount'])
        self.assertEqual(paid['status'], 'SUCCESS')
        self.assertEqual(self.client.request('POST', path, {'simulateFailure': False})[0], 409)
        self.assertEqual(self.client.request('GET', '/api/account')[1]['balance'], 0)
        self.assertEqual([p['status'] for p in self.client.request('GET', '/api/payments')[1]], ['SUCCESS', 'FAILED'])
        self.client.request('POST', '/api/auth/logout')
        self.client.request('POST', '/api/auth/login', self.client.credentials)
        self.assertEqual(len(self.client.request('GET', '/api/payments')[1]), 2)

    def test_ownership_and_staff_permissions(self):
        bill = self.make_bill()
        other = Client()
        other.register()
        self.assertEqual(other.request('GET', f"/api/bills/{bill['id']}")[0], 404)
        self.assertEqual(other.request('POST', f"/api/bills/{bill['id']}/payments", {'simulateFailure': False})[0], 404)
        self.assertEqual(other.request('GET', '/api/bills')[1], [])
        self.assertEqual(other.request('GET', '/api/payments')[1], [])
        self.assertEqual(other.request('GET', '/api/staff/clients')[0], 403)
        self.assertEqual(other.request('PUT', '/api/staff/tariff', {'tariff': 1})[0], 403)

    def test_filters(self):
        bill = self.make_bill()
        self.assertEqual(len(self.client.request('GET', '/api/bills?status=UNPAID')[1]), 1)
        self.assertEqual(self.client.request('GET', '/api/bills?status=PAID')[1], [])
        date = bill['createdAt'][:10]
        self.assertEqual(len(self.client.request('GET', f'/api/bills?from={date}&to={date}')[1]), 1)
        self.assertEqual(self.client.request('GET', '/api/bills?to=2000-01-01')[1], [])
        self.assertEqual(self.client.request('GET', '/api/bills?from=2026-12-31&to=2026-01-01')[0], 400)
        self.assertEqual(self.client.request('GET', '/api/bills?status=unknown')[0], 400)

    def test_concurrent_payments(self):
        bill = self.make_bill()
        second = Client()
        self.assertEqual(second.request('POST', '/api/auth/login', self.client.credentials)[0], 200)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            tasks = [executor.submit(client.request, 'POST', f"/api/bills/{bill['id']}/payments", {'simulateFailure': False})
                     for client in (self.client, second)]
            self.assertEqual(sorted(task.result()[0] for task in tasks), [201, 409])
        self.assertEqual(len(self.client.request('GET', '/api/payments')[1]), 1)

    def test_concurrent_readings(self):
        second = Client()
        second.request('POST', '/api/auth/login', self.client.credentials)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            tasks = [executor.submit(client.request, 'POST', '/api/readings', {'value': 100})
                     for client in (self.client, second)]
            self.assertEqual(sorted(task.result()[0] for task in tasks), [201, 409])
        self.assertEqual(len(self.client.request('GET', '/api/bills')[1]), 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
