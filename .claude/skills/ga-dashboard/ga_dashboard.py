"""톡톡냠냠 GA4 대시보드 생성기 — 읽기 전용 Data API → 정적 HTML 1장.

실행(레포 루트에서): .ga4/venv/bin/python .claude/skills/ga-dashboard/ga_dashboard.py [--days 28] [--host all]
기본은 운영 호스트(PROD_HOST)만 집계한다.
인증: GA4_DIR(기본 <repo>/.ga4)의 token.json, config.json (ga-auth 스킬이 만든 것)
출력: <GA4_DIR>/dashboard/ga_dashboard.html (+ ga_dashboard.json). .ga4/는 gitignore 대상
"""
import argparse
import html
import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange, Dimension, Filter, FilterExpression, FilterExpressionList, Metric, RunReportRequest,
)
from google.oauth2.credentials import Credentials

# 스크립트 위치(.claude/skills/ga-dashboard/) 기준으로 레포 루트를 구한다
REPO_ROOT = Path(__file__).resolve().parents[3]
GA4_DIR = os.environ.get('GA4_DIR', str(REPO_ROOT / '.ga4'))
OUT_DIR = os.path.join(GA4_DIR, 'dashboard')
NOT_SET = '(not set)'
# 운영 호스트만 집계한다. localhost·프리뷰가 이벤트의 대부분이라 거르지 않으면 지표가 오염된다.
# 도메인이 바뀌면 index.html의 debug_mode 호스트 조건도 같이 바꿀 것
PROD_HOST = 'talktalk-naymnaym.vercel.app'
MIN_SAMPLE = 200  # 기획안 §6-3: 모드별 game_mode_select 최소 표본

FUNNEL = [
    ('입력', 'step_input_complete'),
    ('방식 선택 화면', 'game_mode_prompt_view'),
    ('강도 측정', 'step_measure_complete'),
    ('게임 종료', 'step_game_complete'),
    ('결과 완료', 'step_result_complete'),
    ('종료 도달', 'step_end_reached'),
]


def load():
    with open(os.path.join(GA4_DIR, 'config.json')) as f:
        prop = json.load(f)['property_id']
    creds = Credentials.from_authorized_user_file(os.path.join(GA4_DIR, 'token.json'))

    return BetaAnalyticsDataClient(credentials=creds), f'properties/{prop}'


def event_filter(names):
    return FilterExpression(or_group=FilterExpressionList(expressions=[
        FilterExpression(filter=Filter(field_name='eventName', string_filter=Filter.StringFilter(value=n)))
        for n in names
    ]))


def build_filter(events, host):
    parts = []
    if events:
        parts.append(event_filter(events))
    if host:
        parts.append(FilterExpression(filter=Filter(field_name='hostName', string_filter=Filter.StringFilter(value=host))))
    if not parts:
        return None

    return parts[0] if len(parts) == 1 else FilterExpression(and_group=FilterExpressionList(expressions=parts))


def run(client, prop, days, dims, mets, events=None, host=None):
    req = RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date=f'{days}daysAgo', end_date='today')],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        dimension_filter=build_filter(events, host),
        limit=10000,
    )
    res = client.run_report(req)
    out = []
    for row in res.rows:
        item = {d: v.value for d, v in zip(dims, row.dimension_values)}
        item.update({m: float(v.value) for m, v in zip(mets, row.metric_values)})
        out.append(item)

    return out


def ratio(a, b):
    return a / b if b else None


def pct(v):
    return '–' if v is None else f'{v * 100:.1f}%'


def fmt(v, digits=0):
    return '–' if v is None else f'{v:,.{digits}f}'


def band(v):
    try:
        n = int(float(v))
    except ValueError:
        return '미수집'

    return '1–2' if n <= 2 else '3' if n == 3 else '4–5'


def collect(client, prop, days, host):
    q = lambda dims, mets, events=None: run(client, prop, days, dims, mets, events, host)
    cd = lambda n: f'customEvent:{n}'
    data = {}
    data['totals'] = q([], ['totalUsers', 'sessions'])
    data['events'] = q(['eventName'], ['eventCount', 'totalUsers'])
    data['pages'] = q(['pagePath'], ['eventCount', 'totalUsers'], ['page_view'])
    data['daily'] = q(['date', 'eventName'], ['totalUsers'], ['step_input_complete', 'step_end_reached'])
    data['devices'] = q(['deviceCategory'], ['totalUsers'])
    data['result'] = q(
        [cd('game_mode'), cd('intensity_before'), cd('intensity_change'), cd('game_cleared'), cd('buffer_skipped')],
        ['eventCount'], ['step_result_complete'])
    data['game'] = q(
        [cd('game_mode'), cd('game_cleared'), cd('buffer_skipped'), cd('pull_input_method')],
        ['eventCount', cd('game_duration_ms'), cd('buffer_dwell_ms'), cd('game_replay_count'),
         cd('pull_taps'), cd('scratch_ratio')], ['step_game_complete'])
    data['prompt'] = q(
        ['eventName', cd('game_mode')], ['eventCount', cd('decision_ms')],
        ['game_mode_select', 'game_mode_dismiss', 'game_mode_prompt_view'])
    data['abandon'] = q([cd('game_mode')], ['eventCount', cd('progress_ratio')], ['game_abandon'])

    return data


def analyze(d):
    ev = {r['eventName']: r for r in d['events']}
    users = lambda n: ev.get(n, {}).get('totalUsers', 0)
    count = lambda n: ev.get(n, {}).get('eventCount', 0)

    funnel, prev = [], None
    for label, name in FUNNEL:
        u = users(name)
        funnel.append({'label': label, 'event': name, 'users': u, 'prev_rate': ratio(u, prev)})
        prev = u or prev

    a = {
        'users': d['totals'][0]['totalUsers'] if d['totals'] else 0,
        'sessions': d['totals'][0]['sessions'] if d['totals'] else 0,
        'completion_rate': ratio(users('step_end_reached'), users('step_input_complete')),
        'funnel': funnel,
        'events': sorted(d['events'], key=lambda r: -r['eventCount']),
        'pages': sorted(d['pages'], key=lambda r: -r['eventCount']),
        'devices': sorted(d['devices'], key=lambda r: -r['totalUsers']),
        'prompt_dismiss_rate': ratio(count('game_mode_dismiss'), count('game_mode_prompt_view')),
        'game_to_result': ratio(users('step_result_complete'), users('step_game_complete')),
        'abandon_count': count('game_abandon'),
    }

    daily = defaultdict(lambda: {'step_input_complete': 0, 'step_end_reached': 0})
    for r in d['daily']:
        daily[r['date']][r['eventName']] = r['totalUsers']
    a['daily'] = [{'date': k, **v} for k, v in sorted(daily.items())]

    # 결과: 모드별 악화/동일/감소 (buffer_skipped=true 제외 버전과 전체 버전)
    def worsen(rows, key):
        agg = defaultdict(lambda: {'increased': 0, 'decreased': 0, 'same': 0, 'total': 0})
        for r in rows:
            k = key(r)
            c = r['customEvent:intensity_change']
            n = r['eventCount']
            agg[k]['total'] += n
            if c in agg[k]:
                agg[k][c] += n

        return agg

    rr = d['result']
    a['worsen_by_mode'] = worsen(rr, lambda r: r['customEvent:game_mode'])
    a['worsen_by_mode_clean'] = worsen(
        [r for r in rr if r['customEvent:buffer_skipped'] != 'true'], lambda r: r['customEvent:game_mode'])
    a['worsen_by_band'] = worsen(
        [r for r in rr if r['customEvent:buffer_skipped'] != 'true'],
        lambda r: (r['customEvent:game_mode'], band(r['customEvent:intensity_before'])))

    # 게임: 모드별 완주율, 평균 지표
    g = defaultdict(lambda: defaultdict(float))
    for r in d['game']:
        m = r['customEvent:game_mode']
        n = r['eventCount']
        g[m]['total'] += n
        if r['customEvent:game_cleared'] == 'true':
            g[m]['cleared'] += n
            if r['customEvent:buffer_skipped'] == 'true':
                g[m]['skipped'] += n
        for k in ('game_duration_ms', 'buffer_dwell_ms', 'game_replay_count', 'pull_taps', 'scratch_ratio'):
            g[m][k] += r[f'customEvent:{k}']
        g[m]['m_' + r['customEvent:pull_input_method']] += n
    a['game'] = {m: dict(v) for m, v in g.items()}

    # 방식 선택
    p = defaultdict(lambda: defaultdict(float))
    for r in d['prompt']:
        k = r['eventName']
        m = r['customEvent:game_mode']
        p[k][m] += r['eventCount']
        p[k]['decision_sum'] += r['customEvent:decision_ms']
        p[k]['decision_n'] += r['eventCount']
    a['prompt'] = {k: dict(v) for k, v in p.items()}
    a['select_by_mode'] = {m: v for m, v in p.get('game_mode_select', {}).items() if m in ('pull', 'scratch')}

    ab = {r['customEvent:game_mode']: r for r in d['abandon']}
    a['abandon'] = {m: {'count': r['eventCount'], 'avg_progress': ratio(r['customEvent:progress_ratio'], r['eventCount'])}
                    for m, r in ab.items()}

    return a


CSS = """
:root{--bg:#0d0d0d;--surface:#1a1a1a;--text:#f5f5f5;--muted:#9a9a9a;--primary:#e08a3e;--bad:#e5534b;--ok:#6fbf73;--line:#2e2e2e}
@media (prefers-color-scheme:light){:root{--bg:#f6f4ef;--surface:#fff;--text:#1d1d1d;--muted:#6b6b6b;--line:#e3dfd6}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,'Apple SD Gothic Neo',sans-serif}
main{max-width:1000px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 12px;color:var(--primary)}
.sub{color:var(--muted);font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px}.k{font-size:12px;color:var(--muted)}.v{font-size:28px;font-weight:700;margin-top:2px}.hint{font-size:12px;color:var(--muted);margin-top:4px}
.row{display:grid;grid-template-columns:150px 1fr 120px;gap:10px;align-items:center;margin:6px 0;font-size:14px}.bar{height:14px;background:var(--line);border-radius:7px;overflow:hidden}.bar i{display:block;height:100%;background:var(--primary)}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:right;padding:8px 6px;border-bottom:1px solid var(--line)}th:first-child,td:first-child{text-align:left}th{color:var(--muted);font-weight:600;font-size:12px}
.warn{background:rgba(224,138,62,.12);border:1px solid var(--primary);border-radius:10px;padding:10px 14px;font-size:13px;margin:12px 0}.bad{color:var(--bad)}.ok{color:var(--ok)}
.spark{display:flex;align-items:flex-end;gap:3px;height:70px}.spark b{flex:1;background:var(--primary);min-height:2px;border-radius:2px 2px 0 0}
@media(max-width:560px){.row{grid-template-columns:100px 1fr 90px}}
"""


def esc(s):
    return html.escape(str(s))


def card(k, v, hint=''):
    return f'<div class="card"><div class="k">{esc(k)}</div><div class="v">{v}</div><div class="hint">{esc(hint)}</div></div>'


def label_mode(m):
    return {'pull': '뽑기', 'scratch': '스크래치'}.get(m, '미수집 (등록 이전 데이터)' if m == NOT_SET else m)


def render(a, days, generated, host):
    out = [f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
           f'<title>톡톡냠냠 GA 대시보드</title><style>{CSS}</style></head><body><main>',
           f'<h1>톡톡냠냠 GA 대시보드</h1><div class="sub">최근 {days}일 · 호스트 {esc(host or "전체(localhost·프리뷰 포함)")} · 생성 {esc(generated)} · 읽기 전용 스냅샷 (갱신: ga_dashboard.py 재실행)</div>']

    # 1. 요약
    worsen_all = a['worsen_by_mode_clean']
    inc = sum(v['increased'] for v in worsen_all.values())
    tot = sum(v['total'] for v in worsen_all.values())
    out.append('<h2>1. 요약</h2><div class="grid">')
    out.append(card('총 사용자', fmt(a['users'])))
    out.append(card('세션', fmt(a['sessions'])))
    out.append(card('세션 완주율', pct(a['completion_rate']), '종료 도달 ÷ 입력 완료 (사용자 기준)'))
    out.append(card('악화 비율', f'<span class="{"bad" if tot and inc / tot > 0.1 else ""}">{pct(ratio(inc, tot))}</span>',
                    f'버퍼 건너뛰기 제외 결과 완료 {fmt(tot)}건 중 강도 상승 {fmt(inc)}건'))
    out.append('</div>')
    if a['daily']:
        mx = max(max(d['step_input_complete'], d['step_end_reached']) for d in a['daily']) or 1
        bars = ''.join(f'<b title="{d["date"]}: 입력 {int(d["step_input_complete"])} / 종료 {int(d["step_end_reached"])}" '
                       f'style="height:{d["step_end_reached"] / mx * 100:.0f}%"></b>' for d in a['daily'])
        out.append(f'<div class="card" style="margin-top:12px"><div class="k">일별 종료 도달 사용자 (막대 위에 마우스를 올리면 입력 대비 수치)</div><div class="spark">{bars}</div></div>')

    # 2. 퍼널
    out.append('<h2>2. 퍼널 — 어디서 나가는가</h2><div class="card">')
    mx = max((f['users'] for f in a['funnel']), default=0) or 1
    for f in a['funnel']:
        out.append(f'<div class="row"><span>{esc(f["label"])}</span><div class="bar"><i style="width:{f["users"] / mx * 100:.1f}%"></i></div>'
                   f'<span>{fmt(f["users"])}명 · {pct(f["prev_rate"])}</span></div>')
    out.append(f'<div class="hint">오른쪽 %는 이전 단계 대비. 게임 종료→결과 완료 {pct(a["game_to_result"])}, '
               f'방식 선택 화면 닫기 비율 {pct(a["prompt_dismiss_rate"])}, 중도 이탈 {fmt(a["abandon_count"])}건.</div></div>')

    # 3. 방식 비교
    out.append('<h2>3. 게임 방식 비교 (뽑기 vs 스크래치)</h2>')
    sel = a['select_by_mode']
    small = [m for m in ('pull', 'scratch') if sel.get(m, 0) < MIN_SAMPLE]
    if small:
        out.append(f'<div class="warn">⚠ 모드별 선택 {MIN_SAMPLE}건 미만 ({", ".join(label_mode(m) + " " + fmt(sel.get(m, 0)) for m in ("pull", "scratch"))}). '
                   '방향성만 참고하고 제거·변경 판단은 하지 않습니다 (기획안 §6-3). 맞춤 정의는 2026-10-16 이후 데이터부터 쪼개집니다.</div>')
    out.append('<div class="card"><table><tr><th>방식</th><th>선택</th><th>게임 종료</th><th>완주율</th><th>건너뛰기율</th>'
               '<th>평균 시간(초)</th><th>평균 반복</th><th>악화 비율*</th></tr>')
    modes = sorted(set(a['game']) | set(a['worsen_by_mode_clean']), key=lambda m: (m == NOT_SET, m))
    for m in modes:
        g = a['game'].get(m, {})
        w = a['worsen_by_mode_clean'].get(m, {})
        t = g.get('total', 0)
        collected = m != NOT_SET  # 등록 이전 행은 측정항목이 0으로 집계되므로 '–'로 표시
        dur = g['game_duration_ms'] / t / 1000 if collected and t else None
        rep = ratio(g.get('game_replay_count', 0), t) if collected else None
        out.append(f'<tr><td>{esc(label_mode(m))}</td><td>{fmt(sel.get(m, 0))}</td><td>{fmt(t)}</td>'
                   f'<td>{pct(ratio(g.get("cleared", 0), t) if collected else None)}</td>'
                   f'<td>{pct(ratio(g.get("skipped", 0), g.get("cleared", 0)) if collected else None)}</td>'
                   f'<td>{fmt(dur, 1)}</td><td>{fmt(rep, 2)}</td>'
                   f'<td>{pct(ratio(w.get("increased", 0), w.get("total", 0)))}</td></tr>')
    out.append('</table><div class="hint">* 악화 비율은 버퍼를 건너뛴 세션을 제외한 값 (기획안 §6-2: 건너뛴 세션은 모드 비교에서 제외). 반복률 ≥3회는 API 제약으로 평균 반복 횟수로 대체.</div></div>')

    # 4. 안전 — 강도 층별 악화
    out.append('<h2>4. 안전 — 강도 층별 악화 비율</h2><div class="card"><table><tr><th>방식</th><th>강도</th><th>결과 완료</th><th>악화</th><th>동일</th><th>감소</th><th>악화 비율</th></tr>')
    for (m, b), v in sorted(a['worsen_by_band'].items(), key=lambda kv: (kv[0][0] == NOT_SET, kv[0])):
        r = ratio(v['increased'], v['total'])
        out.append(f'<tr><td>{esc(label_mode(m))}</td><td>{esc(b)}</td><td>{fmt(v["total"])}</td><td>{fmt(v["increased"])}</td>'
                   f'<td>{fmt(v["same"])}</td><td>{fmt(v["decreased"])}</td><td class="{"bad" if r and r > 0.1 else ""}">{pct(r)}</td></tr>')
    out.append('</table><div class="hint">강도 구간은 5단계 기준 1–2 / 3 / 4–5. 고강도(4–5)에서 악화가 높으면 다른 지표보다 먼저 봅니다.</div></div>')

    # 5. 모달·버퍼·입력
    pr = a['prompt']
    view = sum(v for k, v in pr.get('game_mode_prompt_view', {}).items() if k not in ('decision_sum', 'decision_n'))
    dis = sum(v for k, v in pr.get('game_mode_dismiss', {}).items() if k not in ('decision_sum', 'decision_n'))
    dsum = sum(pr.get(k, {}).get('decision_sum', 0) for k in ('game_mode_select', 'game_mode_dismiss'))
    dn = sum(pr.get(k, {}).get('decision_n', 0) for k in ('game_mode_select', 'game_mode_dismiss'))
    cleared = sum(g.get('cleared', 0) for g in a['game'].values())
    skipped = sum(g.get('skipped', 0) for g in a['game'].values())
    dwell = sum(g.get('buffer_dwell_ms', 0) for g in a['game'].values())
    out.append('<h2>5. 모달 · 버퍼 · 입력 행태</h2><div class="grid">')
    out.append(card('모달 닫기 비율', pct(ratio(dis, view)), f'화면 {fmt(view)}회 중 {fmt(dis)}회'))
    out.append(card('모달 평균 체류(초)', fmt(ratio(dsum, dn) and dsum / dn / 1000, 1), '선택 또는 닫기까지'))
    out.append(card('버퍼 건너뛰기율', pct(ratio(skipped, cleared)), f'완주 {fmt(cleared)}건 중'))
    out.append(card('버퍼 평균 체류(초)', fmt(ratio(dwell, cleared) and dwell / cleared / 1000, 1), '3.0초 직후에 몰리면 적정'))
    out.append('</div>')
    pm = a['game'].get('pull', {})
    pt = pm.get('total', 0)
    if pt:
        out.append(f'<div class="card" style="margin-top:12px"><div class="k">뽑기 입력 방식 (tap / hold / mixed)</div>'
                   f'<div class="hint">tap {fmt(pm.get("m_tap", 0))} · hold {fmt(pm.get("m_hold", 0))} · mixed {fmt(pm.get("m_mixed", 0))} · '
                   f'평균 타수 {fmt(ratio(pm.get("pull_taps", 0), pt), 1)}</div></div>')
    if a['abandon']:
        rows = ' · '.join(f'{label_mode(m)} {fmt(v["count"])}건 (평균 진행 {pct(v["avg_progress"] if m != NOT_SET else None)})'
                          for m, v in a['abandon'].items())
        out.append(f'<div class="card" style="margin-top:12px"><div class="k">중도 이탈</div><div class="hint">{esc(rows)}</div></div>')

    # 6. 기기, 이벤트
    out.append('<h2>6. 기기 · 수집 점검</h2><div class="grid"><div class="card"><div class="k">기기별 사용자</div><table>')
    for r in a['devices']:
        out.append(f'<tr><td>{esc(r["deviceCategory"])}</td><td>{fmt(r["totalUsers"])}</td></tr>')
    out.append('</table></div><div class="card"><div class="k">이벤트별 수 (9개 이벤트가 모두 보이는지 점검)</div><table>')
    for r in a['events']:
        out.append(f'<tr><td>{esc(r["eventName"])}</td><td>{fmt(r["eventCount"])}</td></tr>')
    out.append('</table></div></div>')

    out.append('<h2>해석 규칙</h2><div class="card hint">인과 주장 금지(두 방식 간 상대 비교와 악화 비율만) · 건너뛰기 세션은 모드 비교 제외 · '
               '선택 비중은 제거 근거 아님 · 제거 판단은 모드별 선택 200건 + 4주 이상 + 3개 게이트 모두 충족 시에만 · '
               '텍스트·사용자 식별자는 수집하지 않음. 사용자 수는 브라우저 기준 근사치.</div></main></body></html>')

    return ''.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=28)
    ap.add_argument('--host', default=PROD_HOST, help="집계할 호스트. 'all'이면 호스트 필터 없음(개발·프리뷰 포함)")
    args = ap.parse_args()
    host = None if args.host == 'all' else args.host

    client, prop = load()
    data = collect(client, prop, args.days, host)
    analysis = analyze(data)
    os.makedirs(OUT_DIR, exist_ok=True)
    generated = datetime.now().strftime('%Y-%m-%d %H:%M')
    with open(os.path.join(OUT_DIR, 'ga_dashboard.html'), 'w', encoding='utf-8') as f:
        f.write(render(analysis, args.days, generated, host))
    with open(os.path.join(OUT_DIR, 'ga_dashboard.json'), 'w', encoding='utf-8') as f:
        serializable = dict(analysis, worsen_by_band={'|'.join(k): v for k, v in analysis['worsen_by_band'].items()})
        json.dump(serializable, f, ensure_ascii=False, indent=2, default=lambda o: dict(o))
    print('ok', os.path.join(OUT_DIR, 'ga_dashboard.html'))


if __name__ == '__main__':
    main()
