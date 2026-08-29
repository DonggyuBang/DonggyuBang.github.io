# BERL 홈페이지 v3 설치 가이드

## 0. 이번 버전에서 수정된 핵심 사항

- `.github/workflows/deploy-pages.yml` 포함
- Mac에서 `.github` 폴더가 숨겨지는 문제를 대비해 `workflow-backup/deploy-pages.yml`도 함께 제공
- GitHub Pages를 `GitHub Actions` 방식으로 직접 배포
- OpenAlex 자동 논문 수집 + citation / h-index / i10-index 계산
- `OPENALEX_API_KEY` GitHub Secret 지원
- 사진이 없거나 파일명이 틀려도 깨진 이미지 대신 기본 아바타 표시
- Formspree endpoint 반영 완료
- BERL 실제 사이트명, 이메일, 전화번호, Scholar, ORCID, OpenAlex ID 반영
- 다크모드, 반응형 메뉴, 통합 검색, 다중 페이지, 최신형 환경공학 연구실 디자인 반영

---

## 1. GitHub에 올리는 가장 안전한 방법

### 방법 A — GitHub 웹에서 업로드할 때

Mac Finder에서는 `.github`가 숨김 폴더입니다.

Finder에서:

`Command + Shift + .`

를 누르면 숨김 파일/폴더가 표시됩니다.

그 다음 ZIP을 푼 폴더 안의 **모든 파일과 폴더**를 GitHub repository 최상위에 업로드합니다.

반드시 아래 파일이 GitHub에서 보여야 합니다.

```text
.github/
└── workflows/
    └── deploy-pages.yml
```

### `.github`가 계속 안 보이면

GitHub repository에서:

`Add file → Create new file`

파일명에 아래를 그대로 입력:

```text
.github/workflows/deploy-pages.yml
```

그리고 이 패키지의:

```text
workflow-backup/deploy-pages.yml
```

내용 전체를 복사하여 붙여넣고 Commit합니다.

---

## 2. GitHub Pages 설정

Repository에서:

`Settings → Pages → Build and deployment → Source`

를:

```text
GitHub Actions
```

로 설정합니다.

`Deploy from a branch`를 선택하지 않습니다.

---

## 3. OpenAlex API key 설정

OpenAlex ID `A5007157661`은 이미 입력해두었습니다.

자동 수집 설정:

```text
data/scholar-config.json
```

현재:

```json
{
  "contact_email_for_openalex": "donggyubang@hanyang.ac.kr",
  "authors": [
    {
      "name": "Byung-Hun Jeon",
      "openalex_id": "A5007157661",
      "orcid": "0000-0002-5478-765X",
      "google_scholar_url": "https://scholar.google.co.kr/citations?user=iLAWDREAAAAJ&hl=en",
      "primary": true
    }
  ]
}
```

### API key를 GitHub에 넣기

OpenAlex에서 무료 API key를 발급받은 후:

`GitHub Repository → Settings → Secrets and variables → Actions`

→ `New repository secret`

Name:

```text
OPENALEX_API_KEY
```

Secret:

```text
OpenAlex에서 발급받은 API key
```

→ Add secret

API key가 없어도 스크립트는 먼저 keyless 요청을 시도하지만, 안정적인 자동 업데이트를 위해 Secret 설정을 권장합니다.

---

## 4. Action 처음 실행

`.github/workflows/deploy-pages.yml`이 main 브랜치에 올라간 뒤:

`Repository → Actions`

왼쪽 목록에서:

```text
Update data and deploy BERL
```

클릭

→ 오른쪽 위 `Run workflow`

→ Branch `main`

→ 초록색 `Run workflow`

정상 실행 순서:

```text
Checkout repository
Set up Python
Synchronize OpenAlex publications
Configure GitHub Pages
Upload website artifact
Deploy to GitHub Pages
```

OpenAlex 로그에서 대략 다음 형태가 보여야 합니다.

```text
Fetching author Byung-Hun Jeon (A5007157661)
OpenAlex resolved: ...
Updated N unique publications...
```

---

## 5. 사진 넣기

현재 교수님 사진 경로:

```json
"photo": "assets/images/byung-hun-jeon.jpg"
```

따라서 실제 파일을 정확히:

```text
assets/images/byung-hun-jeon.jpg
```

에 업로드하면 됩니다.

### 주의

다음은 서로 다른 파일입니다.

```text
byung-hun-jeon.jpg
Byung-Hun-Jeon.jpg
byung-hun-jeon.JPG
byung-hun-jeon.jpeg
```

GitHub Pages는 대소문자를 구분합니다.

이번 v3에서는 사진이 없으면 자동으로:

```text
assets/images/default-avatar.svg
```

가 표시되므로 깨진 이미지 아이콘은 나오지 않습니다.

---

## 6. Contact form

이미 아래 Formspree endpoint를 반영했습니다.

```text
https://formspree.io/f/xgaeeejl
```

연구실 대표 이메일은:

```text
donggyubang@hanyang.ac.kr
```

Formspree에서 해당 form의 destination email을 확인/변경하면 됩니다.

---

## 7. 기본 연구실 정보 수정

```text
data/site.json
```

여기서:

- 연구실명
- 학과
- 학교
- 이메일
- 전화번호
- 홈페이지 URL
- Scholar URL
- Hero 문구

를 수정합니다.

---

## 8. 구성원 추가

```text
data/members.json
```

한 사람을 아래와 같은 구조로 추가합니다.

```json
{
  "id": "member-name",
  "name": "Member Name",
  "position": "Ph.D. Student",
  "group": "Ph.D. Students",
  "affiliation": "Hanyang University",
  "department": "Department of Earth Resources and Environmental Engineering",
  "email": "member@hanyang.ac.kr",
  "photo": "assets/images/member-name.jpg",
  "research_interests": [
    "Anaerobic Digestion",
    "Environmental Biotechnology"
  ],
  "bio": "Short biography.",
  "education": [],
  "scholar_url": "",
  "orcid_url": "",
  "researchgate_url": "",
  "openalex_id": "",
  "featured": false
}
```

`people.html`에 자동으로 카드가 생기고, 클릭하면:

```text
member.html?id=member-name
```

개인 페이지로 이동합니다.

---

## 9. 연구분야

```text
data/research.json
```

수정.

---

## 10. News

```text
data/news.json
```

최신 항목을 추가.

---

## 11. Projects

```text
data/projects.json
```

수정.

---

## 12. Facilities

```text
data/facilities.json
```

수정.

---

## 13. OpenAlex에서 누락된 논문

```text
data/manual-publications.json
```

에 직접 추가하면 자동 수집 데이터와 병합됩니다.

---

## 14. 학교 도메인

패키지에는:

```text
CNAME
```

파일을 포함했고 내용은:

```text
berl.hanyang.ac.kr
```

입니다.

하지만 GitHub 문서상 CNAME 파일만으로 Custom domain 설정이 끝나는 것은 아닙니다.

GitHub에서:

`Settings → Pages → Custom domain`

에:

```text
berl.hanyang.ac.kr
```

을 별도로 입력하고, 학교 DNS 담당자가 GitHub Pages 쪽으로 DNS를 설정해야 합니다.

---

## 15. 로컬에서 홈페이지 미리보기

HTML 파일을 더블클릭하지 말고 프로젝트 폴더에서:

```bash
python3 -m http.server 8000
```

실행 후:

```text
http://localhost:8000
```

접속.

JSON fetch 때문에 `file://` 방식에서는 데이터가 표시되지 않을 수 있습니다.
