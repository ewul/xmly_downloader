import puppeteer from 'puppeteer';
import fs from 'fs';
import { TracksResponse, TracksInfo, Track } from './tracks';
import { AlbumResponse, AlbumInfo } from './album';

const forbidenFilenameCharacters = /[\\\/:"\?\|\*<>]/g;
const webLoginUrl = 'https://passport.ximalaya.com/page/web/login'
const mLoginUrl = 'https://passport.ximalaya.com/page/m/login'
const myUrl = 'https://www.ximalaya.com/my/subscribed/'
const getTracksListUrlTemp = 'https://www.ximalaya.com/revision/album/v1/getTracksList?albumId={albumId}&pageNum={pageNum}&pageSize=1000'
const getAlbumInfoUrlTemp = 'https://www.ximalaya.com/revision/album?albumId={albumId}'
const mQueryAlbumTrackRecordsByPage = 'https://m.ximalaya.com/m-revision/common/album/queryAlbumTrackRecordsByPage?albumId={albumId}&page={pageNum}&pageSize=100&asc=true'
const howManyPages = 10;

declare global {
    interface Window {
        writeABString: any;
    }
}
const fetch = require('node-fetch');

let browser: Promise<puppeteer.Browser>;

let openBrowser = async () => {
    return puppeteer.launch({
        args: ['--start-maximized', '--disable-infobars'],
        headless: false,
        // executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    });
}

let getBrowser = async () => {
    if (browser === undefined) {
        browser = openBrowser();
    }
    return browser;
}

let getAlbumInfo = async () => {
    let browser = await getBrowser();
    let page = (await browser.pages())[0];
    let albumId = await page.evaluate(() => {
        var albumUrl = prompt('请把要下载的专辑网址（https://www.ximalaya.com/类型/专辑号/）粘贴过来：');
        if (albumUrl === null) {
            throw new Error('用户取消。');
        }
        if (!albumUrl.endsWith('/')) {
            albumUrl = albumUrl + '/';
        }
        if (albumUrl.startsWith('http://')) {
            albumUrl.replace('http://', 'https://');
        }
        if (!albumUrl.startsWith('https://')) {
            albumUrl = 'https://' + albumUrl;
        }
        var albumId = albumUrl.split('/').length > 5 ? albumUrl.split('/')[4] : '';
        var albumType = albumUrl.split('/').length > 5 ? albumUrl.split('/')[3] : '';

        if (albumType.length == 0 || albumId.length == 0 || parseInt(albumId).toString().length != albumId.length) {
            alert('输入的专辑网址：' + albumUrl + '不对!');
            throw new Error('无效专辑网址。');
        }

        return albumId;
    });
    console.log('found album id: ' + albumId);
    return albumId;

    // let response = await page.goto(getAlbumInfoUrlTemp.replace('{albumId}', albumId));
    // if (response != null) {
    //     try {
    //         let albumResponse: AlbumResponse = JSON.parse(await response.text())
    //         if (albumResponse.ret == 200 && albumResponse.data != undefined) {
    //             return albumResponse.data as AlbumInfo;
    //         }
    //         else {
    //             throw new Error('接口返回错误:' + albumResponse);
    //         }
    //     }
    //     catch (error) {
    //         throw new Error(error.message);
    //     }
    // }
    // else {
    //     throw new Error('没收到接口结果：' + getAlbumInfoUrlTemp.replace('{albumId}', albumId));
    // }


}

let getCookie = async () => {

    let loginPage = (await (await getBrowser()).pages())[0];

    if (fs.existsSync('./xmly.cookie')) {
        let cookie: puppeteer.Cookie = <puppeteer.Cookie>JSON.parse(fs.readFileSync('./xmly.cookie').toString())
        loginPage.setCookie(cookie);
        return true;
    }

    await loginPage.goto(
        webLoginUrl + '?fromUri=' + myUrl
    );
    //await loginPage.waitForSelector('.login-tab-btn');
    //await loginPage.click('.login-tab-btn');
    await loginPage.waitForNavigation({ timeout: 10 * 60 * 1000 });
    return loginPage.cookies().then((cookies) => {
        for (let cookie of cookies) {
            if (cookie.name == '1&_token') {
                fs.writeFileSync('./xmly.cookie', JSON.stringify(cookie))
                return true;
            }
        }
        throw new Error('登录没成功。');
    });

}

let getDownloadList = async (album: string) => {
    let pageNum = 0;
    let downloadList: Track[] = [];
    let trackTotalCount: number = 0;
    let browser = getBrowser();
    while (downloadList.length < trackTotalCount || trackTotalCount == 0) {
        pageNum++;
        let page = (await browser).newPage();
        let getTracksListUrl = getTracksListUrlTemp
            .replace('{albumId}', album)
            .replace('{pageNum}', pageNum.toString());
        let response = await (await page).goto(getTracksListUrl);
        if (response != null) {
            try {
                let tracksListJson: TracksResponse = JSON.parse(await response.text())
                if (tracksListJson.ret == 200) {
                    trackTotalCount = tracksListJson.data.trackTotalCount;
                    if (tracksListJson.data.tracks.length == 0) {
                        throw new Error('no more data.');
                    }
                    downloadList = downloadList.concat(tracksListJson.data.tracks);
                }
            }
            catch (error) {
                throw new Error(error.message);
            }
            await (await page).close();
        }
        else {
            throw new Error('没收到接口结果：' + getTracksListUrl);
        }

    }

    return downloadList.map(
        (track) => {
            track.url = track.url.replace('/undefined/', '/' + album.mainInfo.crumbs.categoryPinyin + '/' + album + '/');
            return track;
        }).map(
            (track) => {
                track.title = track.title.replace(forbidenFilenameCharacters, '');
                return track;
            }
        );

};

let getCurrentFileList = async (albumTitle: string) => {
    albumTitle = albumTitle.replace(forbidenFilenameCharacters, '');
    if (fs.existsSync('./' + albumTitle + '/')) {
        return fs.readdirSync('./' + albumTitle + '/')
            .filter(
                function (name) {
                    return name.indexOf('.m4a') > 0
                }
            )
            .map(
                function (name) {
                    return name.split('.')[0]
                }
            )
    }
    else {
        fs.mkdirSync('./' + albumTitle);
        return [];
    }
};

let writeABString = async (strbuf: string, targetFile: string) => {
    return new Promise((resolve, reject) => {
        // Convert the ArrayBuffer string back to an ArrayBufffer, which in turn is converted to a Buffer
        const buf = strToBuffer(strbuf);

        // Try saving the file
        fs.writeFile(targetFile, buf, (err) => {
            if (err) reject(err);
            else resolve(targetFile);
        });
    });

    function strToBuffer(str: string) { // Convert a UTF-8 String to an ArrayBuffer
        let buf = new ArrayBuffer(str.length); // 1 byte for each char
        let bufView = new Uint8Array(buf);

        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return Buffer.from(buf);
    }
};

let prepareDownload = async (itemNumber: number) => {

    let pageNumber = howManyPages;
    if (itemNumber < howManyPages) {
        pageNumber = itemNumber;
    }
    for (let i = 1; i < pageNumber; i++) {
        let page = await (await getBrowser()).newPage();
        await page.setUserAgent('user-agent="Mozilla/5.0 (iPod; U; CPU iPhone OS 2_1 like Mac OS X; ja-jp) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.1.1 Mobile/5F137 Safari/525.20');
        await page.exposeFunction("writeABString", writeABString)
            .catch(function (error) {
                console.log('exposeFunction failed: ', error);
            });
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow', downloadPath: './'
        });

    }
    let page = (await ((await getBrowser()).pages()))[0];
    await page.setUserAgent('user-agent="Mozilla/5.0 (iPod; U; CPU iPhone OS 2_1 like Mac OS X; ja-jp) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.1.1 Mobile/5F137 Safari/525.20');
    await page.exposeFunction("writeABString", writeABString)
        .catch(function (error) {
            console.log('exposeFunction failed: ', error);
        });
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow', downloadPath: './'
    });


};

let doDownload = async (page: puppeteer.Page, downloadUrl: string, albumTitle: string, title: string) => {
    await page.evaluate((downloadUrl: string, albumTitle: string, title: string) => {
        let arrayBufferToString = (buffer: ArrayBuffer) => {
            let bufView = new Uint8Array(buffer);
            let length = bufView.length;
            let result = '';
            let addition = Math.pow(2, 8) - 1;
            for (var i = 0; i < length; i += addition) {
                if (i + addition > length) {
                    addition = length - i;
                }
                bufView.subarray(i, i + addition).forEach(
                    (uint8: number) => {
                        result += String.fromCharCode(uint8);
                    }
                );
            }
            return result;
        };
        let url = downloadUrl.replace('http:', 'https:');
        return fetch(url, { credentials: 'same-origin' })
            .then((response: Response) => {
                return response.arrayBuffer();
            })
            .then((arrayBuffer: ArrayBuffer) => {
                var bufString = arrayBufferToString(arrayBuffer);
                return window.writeABString(bufString, './' + albumTitle + '/' + title + '.m4a');
            })
    }, downloadUrl, albumTitle, title);

}

let downloadTasks: Promise<void>[] = [];

let startToDownload = async (albumTitle: string, downloadList: Track[]) => {
    let pages = await (await getBrowser()).pages();
    let k = 0;

    for (let i = 0; i < downloadList.length; i++) {
        if (k >= pages.length) {
            k = 0;
        }
        let downloadItem = downloadList[i];
        await pages[k].bringToFront();
        await pages[k].goto('https://m.ximalaya.com' + downloadItem.url);
        // console.log('page goto' + downloadItem.url);
        // 取名字，顺便看加载完了
        let element = await pages[k].waitForSelector('.v-m._Ow');
        let title = await pages[k].evaluate(element => element.textContent, element);
        console.log('(' + i + '/' + downloadList.length + ')' + title);
        // currentTitle = downloadItem.title;
        // 按开始
        let response = pages[k].waitForResponse((res) => {
            return res.url().indexOf('audiopay.cos.xmcdn.com') > 0 &&
                res.request().headers()['range'] == "bytes=0-";
        });
        await (await pages[k].waitForSelector('.player-sprite.play-btn.player-play._Ow')).click();
        downloadTasks.push(doDownload(pages[k], (await response).url(), albumTitle.replace(forbidenFilenameCharacters, ''), downloadItem.title));
        // await (await pages[k].waitForSelector('.player-sprite.play-btn.player-pause._Ow', {'timeout':2000})).click();
        k++;
    }

};

(async () => {
    let cookie = await getCookie();
    let albumInfo = await getAlbumInfo();
    console.log('Found album info: ' + albumInfo);
    let downloadList = await getDownloadList(albumInfo);
    // console.log(downloadList.map((item: Track) => { return item.url }));
    let currentFileList = await getCurrentFileList(albumInfo.mainInfo.albumTitle);
    downloadList = downloadList.filter((track: Track) => currentFileList.indexOf(track.title) < 0);
    // console.log(cookie);
    await prepareDownload(downloadList.length);
    await startToDownload(albumInfo.mainInfo.albumTitle, downloadList);
    for (let i = 0; i < downloadTasks.length; i++) {
        await downloadTasks[i];
    }
    await (await getBrowser()).close();
})().catch((error) => {
    console.log(error.message);
    getBrowser().then((browser) => browser.close());
});
