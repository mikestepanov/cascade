import sys
import os

path = 'convex/issues/queries.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_head = False
for line in lines:
    if line.strip().startswith('<<<<<<<'):
        skip_head = True
        continue
    if line.strip().startswith('======='):
        skip_head = False
        continue
    if line.strip().startswith('>>>>>>>'):
        continue
    if skip_head:
        continue
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
