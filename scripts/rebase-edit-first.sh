#!/bin/sh
# rebase -i에서 첫 번째 pick을 edit으로 바꿈 (시크릿 제거용)
file="$1"
tmp="${file}.tmp"
sed '1s/^pick/edit/' "$file" > "$tmp" && cp "$tmp" "$file" && rm -f "$tmp"
