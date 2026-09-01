---
name: release-pr
description: >
  master 브랜치를 release 브랜치로 배포하는 PR을 생성하고 일반 머지(--merge)한다.
  머지되면 Vercel이 release 브랜치를 자동 배포한다. 사용자가 "release로 머지해줘",
  "배포 PR 만들어줘", "release PR", "/release-pr" 이라고 할 때 트리거된다.
---

# Release PR (톡톡냠냠 전용)

master → release 배포 PR을 생성하고 머지하는 스킬. release 브랜치는 배포 히스토리
보존이 목적이므로 **일반 머지(--merge)만 사용**한다 (스쿼시 아님).

## 절차

1. **사전 확인**
   ```bash
   git fetch origin
   git status
   git log origin/release..origin/master --oneline
   ```
   - master와 release의 차이가 없으면 "배포할 변경 사항 없음"을 알리고 중단한다.
   - working tree에 uncommitted 변경이 있으면 사용자에게 알리고 진행 여부를 확인한다.

2. **PR 생성**
   ```bash
   gh pr create --base release --head master \
     --title "release: <핵심 변경 요약>" \
     --body "$(cat <<'EOF'
   ## 이번 릴리즈 변경 사항
   - <origin/release..origin/master 커밋 로그 기반으로 요약>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```
   - 제목/본문은 1단계에서 확인한 커밋 로그를 기반으로 직접 요약해서 채운다.

3. **사용자 확인 후 머지**
   - PR 링크를 사용자에게 보여주고 머지해도 되는지 확인한다 (배포를 트리거하는
     행위이므로 반드시 확인 후 진행).
   - 승인되면:
   ```bash
   gh pr merge --merge
   ```
   - `--squash`나 `--rebase`는 사용하지 않는다 (레포 정책, `톡톡냠냠_깃허브_레포_셋팅_계획.md` §5-1).

4. **완료 보고**
   - 머지 완료, Vercel 자동 배포가 시작됨을 안내한다.
   - 다음 단계로 `github-release-publish` 스킬(태그 + GitHub Release 발행)을 쓸 수
     있음을 한 줄로 안내한다.
