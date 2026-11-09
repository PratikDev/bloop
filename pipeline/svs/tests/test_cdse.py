"""CDSE is optional: a failed login is one warning and a skip, never an exception, and the password is never logged."""
import io
import os
import unittest
from contextlib import redirect_stdout
from unittest import mock
from svs import cdse

class Response:
    def __init__(self, status, body):
        self.status_code, self._body = status, body
    def json(self):
        return self._body

class OptionalLogin(unittest.TestCase):
    def setUp(self):
        cdse._warned = False

    def test_bad_login_warns_once_and_skips(self):
        env = {"CDSE_USERNAME": "someone@example.org", "CDSE_PASSWORD": "p&ss=w0rd secret"}
        out = io.StringIO()
        with mock.patch.dict(os.environ, env), mock.patch.object(cdse.requests, "post", return_value=Response(400, {"error_description": "Invalid user credentials"})) as post, redirect_stdout(out):
            self.assertIsNone(cdse.token())
            self.assertIsNone(cdse.token())
            self.assertIsNone(cdse.download({"Id": "x"}, mock.MagicMock(exists=lambda: False)))
        log = out.getvalue()
        self.assertEqual(log.count("WARNING"), 1)
        self.assertNotIn("p&ss=w0rd secret", log)
        body = post.call_args.kwargs["data"]
        self.assertIn("password=p%26ss%3Dw0rd+secret", body)          # URL-encoded form data
        self.assertIn("client_id=cdse-public", body)
        self.assertIn("grant_type=password", body)

    def test_missing_credentials_skip(self):
        with mock.patch.dict(os.environ, {"CDSE_USERNAME": "", "CDSE_PASSWORD": ""}), redirect_stdout(io.StringIO()):
            self.assertIsNone(cdse.token())

if __name__ == "__main__":
    unittest.main()
