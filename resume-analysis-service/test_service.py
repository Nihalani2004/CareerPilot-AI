import base64
import io
import unittest

from docx import Document
from fastapi.testclient import TestClient

from app.main import app


class ResumeAnalysisServiceTests(unittest.TestCase):
    def test_analyzes_a_docx_with_explainable_scores(self):
        document = Document()
        for line in [
            "Professional Summary",
            "Full Stack Developer building web applications.",
            "Technical Skills",
            "JavaScript, React, Node.js, MongoDB, Docker, Git",
            "Experience",
            "- Developed a React platform that reduced API response time by 30%.",
            "- Implemented automated tests for 10,000 users.",
            "Education",
            "B.Tech, 2023 - Present",
        ]:
            document.add_paragraph(line)
        buffer = io.BytesIO()
        document.save(buffer)

        response = TestClient(app).post("/analyze", json={
            "file_base64": base64.b64encode(buffer.getvalue()).decode("ascii"),
            "file_name": "resume.docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })

        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["engineVersion"], "1.0.0")
        self.assertGreater(result["scores"]["overall"], 0)
        self.assertIn("React", result["skills"])
        self.assertIn("\nEducation", result["text"])
        self.assertTrue(next(section for section in result["sections"] if section["key"] == "education")["present"])

    def test_rejects_an_invalid_payload(self):
        response = TestClient(app).post("/analyze", json={
            "file_base64": "not base64",
            "file_name": "resume.pdf",
            "mime_type": "application/pdf",
        })
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
