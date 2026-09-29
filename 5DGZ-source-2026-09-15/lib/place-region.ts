// Store compact province names separately from the actual city/county/district.
const provinceGroups = [
 ['서울','서울특별시','서울시'],['부산','부산광역시','부산시','부산특별시'],
 ['대구','대구광역시','대구시'],['인천','인천광역시','인천시'],['광주','광주광역시'],
 ['대전','대전광역시','대전시'],['울산','울산광역시','울산시'],['세종','세종특별자치시','세종시'],
 ['경기','경기도'],['강원','강원도','강원특별자치도'],['충북','충청북도'],['충남','충청남도'],
 ['전북','전라북도','전북특별자치도'],['전남','전라남도'],['경북','경상북도'],['경남','경상남도'],['제주','제주도','제주특별자치도'],
];
const aliases = new Map(provinceGroups.flatMap(group=>group.map(name=>[name,group[0]] as const)));
const metro = new Set(['서울','부산','대구','인천','광주','대전','울산']);
export function normalizeRegion(input:{province?:string;city?:string;fullAddress?:string;district?:string}) {
 const tokens=(input.fullAddress??'').trim().split(/\s+/);
 const addressProvince=aliases.get(tokens[0]);
 const province=addressProvince??aliases.get((input.province??'').trim())??(input.province??'').trim();
 const valid=(value:string)=>Boolean(value && value!==province && !aliases.has(value) && (metro.has(province)?/^[가-힣]+[구군]$/:/^[가-힣]+[시군구]$/).test(value));
 const fromAddress=addressProvince?tokens.slice(1,3).find(valid):undefined;
 const supplied=(input.city??'').trim().split(/\s+/).find(valid);
 const district=metro.has(province)?(input.district??'').trim():'';
 const city=province==='세종'?'':fromAddress??supplied??(valid(district)?district:'');
 return {province,city};
}
export function regionLabel(input:Parameters<typeof normalizeRegion>[0]) {
 const {province,city}=normalizeRegion(input);
 return [province,city].filter(Boolean).join(' ');
}
