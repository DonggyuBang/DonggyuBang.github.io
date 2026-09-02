# BERL 홈페이지 관리자 기능 설정

이 브랜치는 기존 GitHub Pages 디자인과 기존 `data/news.json`을 유지하면서 Supabase 기반 관리자 로그인 및 News CRUD 기능을 추가합니다.

## 1. Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 생성합니다.
2. Project URL과 Publishable Key를 확인합니다.
3. `assets/js/supabase-config.js`에 두 값을 입력합니다.

```js
window.BERL_SUPABASE = {
  url: 'https://YOUR-PROJECT.supabase.co',
  publishableKey: 'YOUR_PUBLISHABLE_KEY'
};
```

> 브라우저 코드에는 Publishable Key만 사용합니다. `service_role`, secret key 등 비밀 키는 절대 GitHub에 커밋하지 마세요.

## 2. 데이터베이스와 보안 정책 생성

Supabase > SQL Editor에서 `supabase/berl-admin-setup.sql` 전체를 실행합니다.

이 SQL은 다음을 생성합니다.

- `news` 테이블
- `admin_users` 테이블
- `is_admin()` 함수
- 공개 뉴스 읽기 정책
- 관리자 전용 추가/수정/삭제 정책

## 3. 관리자 계정 생성

Supabase > Authentication > Users에서 관리자 이메일/비밀번호 사용자를 생성합니다.

생성된 사용자의 UUID를 복사한 후 SQL Editor에서 아래 쿼리를 실행합니다.

```sql
insert into public.admin_users (user_id)
values ('여기에-관리자-user-uuid')
on conflict (user_id) do nothing;
```

## 4. 기존 뉴스 가져오기

사이트가 배포된 후 `/admin/`으로 접속합니다.

예: `https://사이트주소/admin/`

1. 관리자 계정으로 로그인
2. `Import existing JSON` 클릭
3. 기존 `data/news.json` 뉴스가 Supabase `news` 테이블로 복사됩니다.

slug가 같은 뉴스는 업데이트되므로 중복 가져오기를 해도 같은 slug가 여러 개 생기지 않습니다.

## 5. 동작 방식

- Supabase 설정이 비어 있으면 기존 `data/news.json`을 그대로 사용합니다.
- Supabase 연결 오류가 발생해도 방문자 페이지는 자동으로 기존 JSON으로 돌아갑니다.
- Supabase에 게시된 뉴스가 존재하면 홈페이지, News 목록, News 상세 페이지가 Supabase 데이터를 사용합니다.
- 관리자는 `/admin/`에서 News를 추가/수정/삭제할 수 있습니다.

## 6. 이번 단계에 포함된 범위

- 관리자 이메일/비밀번호 로그인
- 관리자 UUID 화이트리스트
- News 추가/수정/삭제
- 게시/비게시 상태
- 기존 `news.json` 일괄 가져오기
- 기존 홈페이지 Latest News 5개 및 News 페이지 연동
- Supabase 미설정/장애 시 JSON fallback

다음 단계에서 같은 패턴으로 `members`, `research`, `projects`, `site settings` 및 Supabase Storage 이미지 업로드를 확장할 수 있습니다.
