import type { FacilityInfo } from "@/types";

export const STATIC_ARBORETUM_FACILITIES: FacilityInfo[] = [
  {
    id: "arboretum-1",
    name: "Korea National Arboretum",
    type: "arboretum",
    address: "509 Gwangneungsumogwon-ro, Pocheon-si, Gyeonggi-do",
    lat: 37.754518,
    lng: 127.165883,
    tel: "031-540-2000",
    homepage: "http://www.forest.go.kr/newkfsweb/kfs/idx/SubIndex.do?orgId=kna&mn=KFS_15",
    intro: "OWNER_NM: Korea National Arboretum / RCAR_NM: Korea National Arboretum",
    programs: ["arboretum", "public forest"],
    trails: [],
    accessibility: {
      wheelchair: false,
      stroller: false,
      parking: false,
      restroom: false,
      elevator: false,
      helpdog: false,
    },
    detailSections: [
      {
        title: "Operation",
        items: [
          { label: "OWNER_NM", value: "Korea National Arboretum" },
          { label: "RCAR_NM", value: "Korea National Arboretum" },
          { label: "Telephone", value: "031-540-2000" },
        ],
      },
    ],
  },
];
