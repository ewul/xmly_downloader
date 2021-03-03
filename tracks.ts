export interface TracksResponse {
    ret: number,
    msg: string,
    data: TracksInfo
}

export interface TracksInfo {
    currentUid: number,
    albumId: number,
    trackTotalCount: number,
    sort: number,
    tracks: Track[]
}

export interface Track {
    index: number,
    trackId: number,
    isPaid: boolean,
    tag: number,
    title: string,
    playCount: number,
    showLikeBtn: boolean,
    isLike: boolean,
    showShareBtn: boolean,
    showForwardBtn: boolean,
    createDateFormat: string,
    url: string,
    duration: number,
    isVideo: boolean,
    videoCover: Object,
    isVipFirst: boolean,
    breakSecond: boolean,
    length: boolean
}
