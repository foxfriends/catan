'use strict';

let roads = [
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1]
];
let houses = [
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]]
];
let tiles = [
    [[0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0]]
];

export let adjacent = (i, j, typea, typeb) => {
    let adj = {
        tile: {
            road: (a, b) => {
                let x = [
                    [
                        [a * 2, b * 2],
                        [a * 2, b * 2 + 1],
                        [a * 2 + 1, b * 2],
                        [a * 2 + 1, b * 2 + 1],
                        [a * 2 + 2, b * 2 + 1],
                        [a * 2 + 2, b * 2 + 2]
                    ],
                    [
                        [a * 2, b * 2 + 1],
                        [a * 2, b * 2 + 2],
                        [a * 2 + 1, b * 2],
                        [a * 2 + 1, b * 2 + 1],
                        [a * 2 + 2, b * 2 + 1],
                        [a * 2 + 2, b * 2 + 2]
                    ],
                    [
                        [a * 2, b * 2 + 1],
                        [a * 2, b * 2 + 2],
                        [a * 2 + 1, b * 2],
                        [a * 2 + 1, b * 2 + 1],
                        [a * 2 + 2, b * 2],
                        [a * 2 + 2, b * 2 + 1]
                    ]
                ];
                return x[Math.max(0, Math.min(a - 1, 2))];
            },
            house: (a, b) => {
                let x = [
                    [
                        [a, b * 2],
                        [a, b * 2 + 1],
                        [a, b * 2 + 2],
                        [a + 1, b * 2 + 1],
                        [a + 1, b * 2 + 2],
                        [a + 1, b * 2 + 3]
                    ],
                    [
                        [a, b * 2],
                        [a, b * 2 + 1],
                        [a, b * 2 + 2],
                        [a + 1, b * 2],
                        [a + 1, b * 2 + 1],
                        [a + 1, b * 2 + 2]
                    ],
                    [
                        [a, b * 2 + 1],
                        [a, b * 2 + 2],
                        [a, b * 2 + 3],
                        [a + 1, b * 2],
                        [a + 1, b * 2 + 1],
                        [a + 1, b * 2 + 2]
                    ]
                ];
                return x[Math.max(0, Math.min(a - 1, 2))];
            },
            tile: (a, b) => {
                let x = [
                    [
                        [a - 1, b - 1], [a - 1, b],
                        [a, b - 1], [a, b + 1],
                        [a + 1, b], [a + 1, b + 1]
                    ],
                    [
                        [a - 1, b - 1], [a - 1, b],
                        [a, b - 1], [a, b + 1],
                        [a + 1, b - 1], [a + 1, b]
                    ],
                    [
                        [a - 1, b], [a - 1, b + 1],
                        [a, b - 1], [a, b + 1],
                        [a + 1, b - 1], [a + 1, b]
                    ]
                ];
                let set = x[Math.max(0, Math.min(a - 1, 2))];
                for(let y = set.length - 1; y >= 0; y--) {
                    if(set[y][0] >= tiles.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= tiles[set[y][0]].length) {
                        set.splice(y, 1);
                    }
                }
                return set;
            }
        },
        road: {
            road: (a, b) => {
                let x, y, set;
                if(a % 2) {
                    x = [
                        [
                            [a - 1, b * 2 - 1],
                            [a - 1, b * 2],
                            [a + 1, b * 2],
                            [a + 1, b * 2 + 1]
                        ],
                        [
                            [a - 1, b * 2 - 1],
                            [a - 1, b * 2],
                            [a + 1, b * 2 - 1],
                            [a + 1, b * 2]
                        ],
                        [
                            [a - 1, b * 2],
                            [a - 1, b * 2 + 1],
                            [a + 1, b * 2 - 1],
                            [a + 1, b * 2]
                        ]
                    ];
                    set = x[1 - ((a < 5)?1:0) + ((a > 5)?1:0)];
                    for(y = set.length - 1; y >= 0; y--) {
                        if(set[y][0] >= roads.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= roads[set[y][0]].length) {
                            set.splice(y, 1);
                        }
                    }
                    return set;
                } else {
                    x = [
                        [
                            [a, b - 1],
                            [a, b + 1],
                            [a - 1, Math.floor(b / 2)],
                            [a + 1, Math.ceil(b / 2)]
                        ],
                        [
                            [a, b - 1],
                            [a, b + 1],
                            [a - 1, Math.ceil(b / 2)],
                            [a + 1, Math.floor(b / 2)]
                        ]
                    ];
                    set = x[Math.floor(a / 6)];
                    for(y = set.length - 1; y >= 0; y--) {
                        if(set[y][0] >= roads.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= roads[set[y][0]].length) {
                            set.splice(y, 1);
                        }
                    }
                    return set;
                }
            },
            house: (a, b) => {
                if(a % 2) {
                    let x = [
                        [
                            [a - 1, b * 2],
                            [a + 1, b * 2 + 1]
                        ],
                        [
                            [a - 1, b * 2],
                            [a + 1, b * 2]
                        ],
                        [
                            [a - 1, b * 2 + 1],
                            [a + 1, b * 2]
                        ]
                    ];
                    return x[1 - (a < 5) + (a > 5)];
                } else {
                    return [
                        [a, b],
                        [a, b + 1]
                    ];
                }
            }
        },
        house: {
            road: (a, b) => {
                let x = [
                    [
                        [a * 2, b - 1],
                        [a * 2, b],
                        [a * 2 + (~b & 1) - (b & 1), Math.floor(
                            b / 2)]
                    ],
                    [
                        [a * 2, b - 1],
                        [a * 2, b],
                        [a * 2 - (~b & 1) + (b & 1), Math.floor(
                            b / 2)]
                    ]
                ];
                let set = x[0 + (a > 2)];
                for(let y = set.length - 1; y >= 0; y--) {
                    if(set[y][0] >= roads.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= roads[set[y][0]].length) {
                        set.splice(y, 1);
                    }
                }
                return set;
            },
            house: (a, b) => {
                let x = [
                    [
                        [a, b - 1],
                        [a, b + 1],
                        [a + (~b & 1) - (b & 1), b + (~b &
                            1) - (b & 1)]
                    ],
                    [
                        [a, b - 1],
                        [a, b + 1],
                        [a + (~b & 1) - (b & 1), b - (b & 1)]
                    ],
                    [
                        [a, b - 1],
                        [a, b + 1],
                        [a - (~b & 1) + (b & 1), b - (b & 1)]
                    ],
                    [
                        [a, b - 1],
                        [a, b + 1],
                        [a - (~b & 1) + (b & 1), b + (~b &
                            1) - (b & 1)]
                    ]
                ];
                let set = x[Math.max(0, Math.min(i - 1, 3))];
                for(let y = set.length - 1; y >= 0; y--) {
                    if(set[y][0] >= houses.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= houses[set[y][0]].length) {
                        set.splice(y, 1);
                    }
                }
                return set;
            },
            tile: (a, b) => {
                let x = [
                    [
                        [
                            [a - 1, b / 2 - 1],
                            [a, b / 2 - 1],
                            [a, b / 2]
                        ],
                        [
                            [a - 1, Math.floor(b / 2) - 1],
                            [a - 1, Math.floor(b / 2)],
                            [a, Math.floor(b / 2)]
                        ]
                    ],
                    [
                        [
                            [a - 1, b / 2 - 1],
                            [a - 1, b / 2],
                            [a, b / 2 - 1]
                        ],
                        [
                            [a - 1, Math.floor(b / 2)],
                            [a, Math.floor(b / 2) - 1],
                            [a, Math.floor(b / 2)]
                        ]
                    ]
                ];
                let set = x[a <= 2 ? 0 : 1][b % 2];
                for(let y = set.length - 1; y >= 0; y--) {
                    if(set[y][0] >= tiles.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= tiles[set[y][0]].length) {
                        set.splice(y, 1);
                    }
                }
                return set;
            },
            port: (a, b) => {
                switch(a) {
                    case 0:
                        if(b === 0 || b === 1) {
                            return 0;
                        } else if(b === 3 || b === 4) {
                            return 1;
                        }
                        return null;
                    case 1:
                        if(b === 0) {
                            return 3;
                        } else if(b === 7 || b === 8) {
                            return 2;
                        }
                        return null;
                    case 2:
                        if(b === 1) {
                            return 3;
                        } else if(b === 10) {
                            return 4;
                        }
                        return null;
                    case 3:
                        if(b === 1) {
                            return 5;
                        } else if(b === 10) {
                            return 4;
                        }
                        return null;
                    case 4:
                        if(b === 0) {
                            return 5;
                        } else if(b === 7 || b === 8) {
                            return 6;
                        }
                        return null;
                    case 5:
                        if(b === 0 || b === 1) {
                            return 7;
                        } else if(b === 3 || b === 4) {
                            return 8;
                        }
                        return null;
                }
            }
        }
    };
    return adj[typea][typeb](i, j);
};
