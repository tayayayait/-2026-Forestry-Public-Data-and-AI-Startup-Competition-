# Kids Forest Operational Map Basis

Updated: 2026-05-26

The kids forest map uses only the local `유아숲체험원_UTM-K` SHP/DBF-derived coordinate seed records whose `운영현황` value is `운영`.

Source-file counts:

- Total SHP point records: 332
- Operational records (`운영`): 288
- Non-operational records (`미운영`): 11
- Blank-status records: 33

`/kids-map` and `/api/kids-forests` expose only the 288 operational records. The 11 non-operational records and 33 blank-status records are intentionally excluded from the default map, recommendation candidates, and shared facility detail entry points.

In this operating mode, ODCloud's 499-row API and the 178 geocoded coordinate supplements are not used to determine the kids forest map display count.

ODCloud's `산림청_유아숲체험원 현황_20241231` API is still used as enrichment for the 288 displayed facilities when a matching API row is available. The enriched fields are `운영기간`, `전화번호`, and `참여방법`. API lookup failure must not remove the 288 SHP-operational map records.

Kids forest detail pages use a data-fit structure:

- `소개`: facility identity, source-backed operation state, and source disclosure.
- `방문안내`: ODCloud operating period, phone number, and participation method.
- `사진`: the shared Naver/Kakao/Gemini-curated gallery used by other facility types.
- `교통정보`: route and map actions based on SHP coordinates.

The kids forest API does not provide official homepage URLs. The detail page therefore omits homepage-dependent link summary and search-fallback UI for kids forest facilities.
