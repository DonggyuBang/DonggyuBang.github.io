# BERL Website v6 update summary

이번 패키지에는 다음 사항이 반영되었습니다.

1. 생성형 Hero 배경 이미지 적용
2. 생성형 Research Area 이미지 적용
3. News 목록 → 상세 기사 페이지(news-detail.html?id=slug) 구조 적용
4. People 그룹 순서를 직급순(Advisor → Research Professors → Postdoctoral Researchers → Ph.D. Students → Integrated M.S./Ph.D. Students → M.S. Students)으로 정렬
5. 드롭다운 hover 유지 시간 개선
6. 메인 페이지에 스크롤 기반 모션, 카운트업, 캐러셀, 동적 전환 요소 반영
7. Contact를 상위 독립 메뉴로 유지
8. About BERL 메뉴를 단일 항목으로 유지

## 이미지 파일 위치
- Hero: assets/images/generated/hero-environment.jpg
- Research sprite: assets/images/generated/generated-research-sprite.jpg
- Individual research images: assets/images/generated/

## 주의
- Byung-Hun Jeon 사진은 실제 사진이 없으므로 기본 아바타로 설정했습니다.
- 실제 인물 사진을 쓰려면 assets/images/ 아래에 파일을 넣고 data/members.json의 photo 경로를 수정하세요.
