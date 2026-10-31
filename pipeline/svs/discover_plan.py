"""The SVS IDs the related-datasets plan names, with the plan step that names them (Phase 2 ingest order, twins, Phase 5
sonification references). One table: Phase 0 marks these rows, Phase 2 ingests from it, Phase 6 picks dry-run items
outside it."""

PLAN = {**{i: "2.1 live" for i in (5624, 5650)}, 4993: "2.2 Dixie Fire", **{i: "2.3 lightning" for i in (3144, 3143)},
        **{i: "2.4 ocean" for i in (3913, 4353, 4332, 3821, 3827)}, **{i: "2.5 rain / atmospheric river" for i in (4372, 4445, 4417, 4939)},
        **{i: "2.6 GHG / CO2" for i in (4514, 5115, 5110, 5273, 5116, 5117, 5118, 5121, 5047, 5081, 5126, 5119)},
        **{i: "2.7 wildfire" for i in (5557, 5639, 5453, 5597, 5601)},
        **{i: "2.8 sea level / vital signs" for i in (5235, 5221, 5611, 5516, 4345, 5190, 5207, 5209, 5111, 5382, 5099)},
        **{i: "2.9 agriculture, water, biodiversity, disasters" for i in (5087, 5098, 4889, 4968, 5075, 5584, 5072, 5468, 4658, 12616,
                                                                          5276, 5475, 5477, 30919)},
        **{i: "2.10 air quality" for i in (5142, 5175, 5303, 5104, 5070, 4764, 4810, 5107, 14439)},
        **{i: "1 twin" for i in (5436, 5479, 5505, 5518, 5552)},
        **{i: "5 sonification" for i in (13893, 13997, 13998, 13999, 13061, 14802)}}

# The plan's twin pairs (Phase 2 test of the twin finder): official or hyperwall ID → its 2:1 / SOS versions.
TWIN_PAIRS = {5196: (5436,), 5425: (5479, 5505), 5313: (5475,), 5533: (5518,), 5572: (5552,), 5110: (5273,)}
