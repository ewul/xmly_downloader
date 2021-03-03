import { TracksInfo } from './tracks'

export interface AlbumResponse {
    ret: number,
    msg: string,
    data: AlbumInfo
}

export interface AlbumInfo {
    isSelfAlbum: boolean,
    currentUid: number,
    albumId: number,
    mainInfo: MainInfo,
    anchorInfo: any,
    tracksInfo: TracksInfo,
    subSiteAlbumUrl: string,
    recommendKw: {
        sourceKw: string,
        recommendText: string[]
    }
    draft: any,
    isTemporaryVIP: boolean,
}

export interface MainInfo {
    albumStatus: number,
    showApplyFinishBtn: boolean,
    showEditBtn: boolean,
    showTrackManagerBtn: boolean,
    showInformBtn: boolean,
    cover: string,
    albumTitle: string,
    crumbs: Crumbs,
    categoryId: number,
    categoryPinyin: string,
    categoryTitle: string,
    subcategoryId: number,
    subcategoryName: string,
    subcategoryDisplayName: string,
    subcategoryCode: string,
    updateDate: string,
    createDate: string,
    playCount: number,
    isPaid: boolean,
    priceOp: any,
    isFinished: number,
    metas: any,
    isSubscribe: boolean,
    richIntro: string,
    shortIntro: string,
    detailRichIntro: string,
    isPublic: boolean,
    hasBuy: boolean,
    vipType: number,
    canCopyText: boolean,
    subscribeCount: number
}

export interface Crumbs{
    categoryId: number,
    categoryPinyin: string,
    categoryTitle: string,
    subcategoryId: number,
    subcategoryName: string,
    subcategoryDisplayName: string,
    subcategoryCode: string
}