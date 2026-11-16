import pathlib, json, re
# VERSION
vpath = pathlib.Path("VERSION")
if vpath.exists():
    cur = vpath.read_text().strip()
else:
    cur = "1.0.6"
parts = cur.split(".")
parts[-1] = str(int(parts[-1]) + 1)
nueva = ".".join(parts)
vpath.write_text(nueva + "\n")
print(f"version nueva: {nueva}")
# package.json
pj = pathlib.Path("package.json")
j = json.loads(pj.read_text())
j["version"] = nueva
pj.write_text(json.dumps(j, indent=2))
# index.html - muestra la version en el pie
idx = pathlib.Path("index.html")
s = idx.read_text()
if "VERSION-BF" in s:
    s = re.sub(r"VERSION-BF v[0-9.]+", f"VERSION-BF v{nueva}", s)
else:
    s = s.replace("</body>", f"<div style='text-align:center;opacity:0.5;font-size:11px'>VERSION-BF v{nueva}</div>\n</body>")
idx.write_text(s)
# android versionCode y versionName
bg = pathlib.Path("android/app/build.gradle")
b = bg.read_text()
b = re.sub(r"versionCode \d+", f"versionCode {int(parts[-1])}", b)
b = re.sub(r'versionName "[^"]+"', f'versionName "{nueva}"', b)
bg.write_text(b)
print("package.json, index.html y build.gradle actualizados")
