from pathlib import Path
import re
path = Path(r"src/screens/eic/NetworkDashboard.js")
text = path.read_text()
pattern = r"      cardHeader: \{[^}]+\},\r\n      msTitle: \{[^}]+\},\r\n      msId: \{[^}]+\},\r\n      msMeta: \{[^}]+\},\r\n"
replacement = "      cardHeader: {\r\n        paddingTop: theme.spacing(0.15),\r\n        paddingBottom: theme.spacing(0.15),\r\n        borderBottomWidth: 1,\r\n        borderBottomColor: theme.colors.borderSubtle,\r\n        marginBottom: theme.spacing(0.15),\r\n        gap: theme.spacing(0.15),\r\n      },\r\n      fieldRow: {\r\n        flexDirection: \"row\",\r\n        alignItems: \"baseline\",\r\n        gap: theme.spacing(0.75),\r\n      },\r\n      fieldLabel: {\r\n        fontSize: theme.typography.sizes.caption,\r\n        color: theme.colors.textSecondary,\r\n        textTransform: \"uppercase\",\r\n        letterSpacing: 0.5,\r\n      },\r\n      fieldValue: {\r\n        fontSize: theme.typography.sizes.body,\r\n        color: theme.colors.textPrimary,\r\n        fontWeight: theme.typTypography?.weightSemiBold || \"600\",\r\n        flexShrink: 1,\r\n      },\r\n"
new_text, count = re.subn(pattern, replacement, text)
if count != 1:
    raise SystemExit(f'expected 1 replacement, got {count}')
path.write_text(new_text)
