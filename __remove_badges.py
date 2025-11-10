from pathlib import Path
path = Path(r"src/screens/eic/NetworkDashboard.js")
text = path.read_text(encoding="utf-8")
begin = text.index("      badgeColumn:")
end = text.index("      sectionLabel:", begin)
text = text[:begin] + text[end:]
path.write_text(text, encoding="utf-8")
