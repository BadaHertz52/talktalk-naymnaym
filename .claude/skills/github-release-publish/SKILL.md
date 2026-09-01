---
name: github-release-publish
description: >
  release 브랜치에 git 태그를 생성하고 GitHub Release를 발행한다. master→release
  머지(release-pr 스킬) 이후, 실제 배포 버전을 기록하는 단계에서 사용한다.
  사용자가 "깃허브 레포 release 업데이트해줘", "릴리즈 발행해줘", "태그 만들고
  릴리즈 올려줘", "/github-release-publish" 라고 할 때 트리거된다.
---

# GitHub Release Publish (톡톡냠냠 전용)

release 브랜치 기준으로 SemVer 태그를 만들고 GitHub Release를 발행하는 스킬.
절차는 `톡톡냠냠_깃허브_레포_셋팅_계획.md` §5 기준.

## 절차

1. **버전 결정**
   ```bash
   git fetch --tags
   gh release list --limit 1
   ```
   - 마지막 태그를 확인하고, 이번 변경 성격(버그 수정=PATCH, 기능 추가=MINOR,
     0.x.x 단계에서는 MAJOR 올리지 않음)에 맞는 다음 버전을 사용자에게 제안한다.
   - 사용자가 버전을 직접 지정하면 그것을 따른다.

2. **release 브랜치 최신 상태 확인**
   ```bash
   git fetch origin
   git log origin/release --oneline -5
   ```

3. **태그 생성 및 push (사용자 확인 후)**
   - 어떤 태그를 어떤 커밋에 생성할지 보여주고 확인받는다.
   ```bash
   git checkout release
   git pull origin release
   git tag -a vX.Y.Z -m "vX.Y.Z: <핵심 변경 요약>"
   git push origin vX.Y.Z
   ```

4. **GitHub Release 발행**
   - release 대상 기간의 커밋 로그(`git log <이전태그>..vX.Y.Z --oneline`)를 바탕으로
     릴리즈 노트를 직접 요약해 작성한다.
   ```bash
   gh release create vX.Y.Z \
     --title "vX.Y.Z - <한 줄 요약>" \
     --notes "$(cat <<'EOF'
   ## 이번 릴리즈 변경 사항
   - ...

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )" \
     --target release
   ```

5. **완료 보고**
   - 발행된 Release URL(`gh release view vX.Y.Z --web` 없이 `gh release list`로 확인 가능)을 안내한다.
   - Wiki `버전별-업데이트-히스토리` 페이지 갱신이 필요하면 사용자에게 상기시킨다
     (자동 실행하지 않음 — 별도 요청 시에만).
