# Gera /workspace/sanguinarium-build.zip com a build estática jogável.
import os, zipfile, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/workspace/sanguinarium-build.zip'
include = ['index.html', 'style.css', 'README.md', 'CHECKPOINTS.md', 'GDD.md', 'src', 'vendor']
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for item in include:
        p = os.path.join(root, item)
        if os.path.isdir(p):
            for d, _, files in os.walk(p):
                for f in files:
                    full = os.path.join(d, f)
                    z.write(full, os.path.join('sanguinarium', os.path.relpath(full, root)))
        else:
            z.write(p, os.path.join('sanguinarium', item))
print('zip:', out, os.path.getsize(out), 'bytes')
