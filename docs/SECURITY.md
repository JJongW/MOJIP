# 보안 안내

## 노출된 Supabase anon key 처리

과거에 `web/.env.example`에 실제 Supabase URL/anon key가 커밋된 적이 있습니다.

### 반드시 할 일: 키 로테이션

1. [Supabase Dashboard](https://supabase.com/dashboard) → 해당 프로젝트
2. **Settings** → **API** 이동
3. **Project API keys**에서 anon key **Reveal** 후 **Regenerate** 또는 새 키 발급 후 기존 키 비활성화
4. 로컬 `web/.env`와 Vercel(또는 사용 중인 배포) 환경 변수를 새 키로 갱신

이렇게 하면 이전에 커밋된 키는 더 이상 유효하지 않습니다.

### 커밋 정리 (선택)

- **이미 적용한 수정**: `.env.example`은 플레이스홀더만 남겨 두었고, 루트 `.gitignore`에 `.env` 규칙을 추가했습니다. 이 변경을 커밋해 푸시하면 새 커밋부터는 시크릿이 포함되지 않습니다.
- **히스토리에서 완전 제거**를 원하면: `git filter-repo` 또는 BFG로 해당 파일 이력에서 시크릿이 들어간 버전을 제거한 뒤 `feature/mojip-web-supabase`에 force push할 수 있습니다. (협업 중인 브랜치면 팀과 조율 필요.)

## 앞으로

- 실제 URL/키는 `web/.env`에만 두고, `web/.env`는 `.gitignore`로 커밋되지 않도록 했습니다.
- `web/.env.example`에는 `https://xxxx.supabase.co`, `eyJhbGc...` 같은 플레이스홀더만 사용하세요.
