// =====================================
// 1. HTML要素の取得
// =====================================
const showAddFormButton = document.getElementById('showAddFormButton');
const addBookmarkModal = document.getElementById('addBookmarkModal');
const closeButton = addBookmarkModal.querySelector('.close-button');
const addBookmarkForm = document.getElementById('addBookmarkForm');
const urlInput = document.getElementById('urlInput');
const titleInput = document.getElementById('titleInput');
const bookmarkList = document.getElementById('bookmark-list');
const alertArea = document.getElementById('alertArea');
const adFooter = document.getElementById('ad-footer'); // 広告エリア
const urlWarningModal = document.getElementById('urlWarningModal');
const confirmGoButton = document.getElementById('confirmGoButton');
const cancelGoButton = document.getElementById('cancelGoButton');
const showSettingsButton = document.getElementById('showSettingsButton'); // 追加
const settingsModal = document.getElementById('settingsModal');         // 追加
const closeSettingsButton = document.getElementById('closeSettingsButton'); // 追加
const settingsForm = document.getElementById('settingsForm');           // 追加
// ★変更: 設定入力要素のIDを新しいHTMLに合わせて変更★
const expirationValueInput = document.getElementById('expirationValueInput'); 
const expirationUnitSelect = document.getElementById('expirationUnitSelect');
const alertValueInput = document.getElementById('alertValueInput');
const alertUnitSelect = document.getElementById('alertUnitSelect');

// ★追加：タイトル入力用モーダル関連の要素
const titlePromptModal = document.getElementById('titlePromptModal');
const titlePromptInput = document.getElementById('titlePromptInput');
const titlePromptConfirmButton = document.getElementById('titlePromptConfirmButton');
const titlePromptSkipButton = document.getElementById('titlePromptSkipButton');

let currentNavigatingUrl = ''; // 警告モーダルで開くURLを保持

// =====================================
// 2. データ管理（ブックマークの保存・読み込み、アプリ最終アクセス時刻）
// =====================================
let bookmarks = []; // ブックマークを保存する配列

let lastAppAccessTime = new Date(); // アプリへの最終アクセス時刻

// ブックマークデータをローカルストレージに保存する関数
function saveBookmarks() {
    localStorage.setItem('volatileBookmarks', JSON.stringify(bookmarks));
    console.log('ブックマークを保存しました。');
}

// ローカルストレージからブックマークデータを読み込む関数
function loadBookmarks() {
    const savedBookmarks = localStorage.getItem('volatileBookmarks');
    if (savedBookmarks) {
        // Dateオブジェクトとして復元するため、mapで処理
        bookmarks = JSON.parse(savedBookmarks).map(bm => ({
            ...bm,
            registeredAt: new Date(bm.registeredAt),
            lastAccessed: bm.lastAccessed ? new Date(bm.lastAccessed) : null // lastAccessedがない場合も考慮
        }));
        console.log('ブックマークを読み込みました。', bookmarks);
    }
}

// アプリへの最終アクセス時刻をローカルストレージに保存する関数
function saveLastAccessTime() {
    localStorage.setItem('volatileAppLastAccess', lastAppAccessTime.toISOString());
    console.log('アプリ最終アクセス時刻を保存しました。', lastAppAccessTime);
}

// ローカルストレージからアプリへの最終アクセス時刻を読み込む関数
function loadLastAccessTime() {
    const savedTime = localStorage.getItem('volatileAppLastAccess');
    if (savedTime) {
        lastAppAccessTime = new Date(savedTime);
        console.log('アプリ最終アクセス時刻を読み込みました。', lastAppAccessTime);
    } else {
        // 初回アクセス時、またはデータがない場合は現在時刻をセット
        lastAppAccessTime = new Date();
        saveLastAccessTime();
    }
}

// =====================================
// 3. ブックマークの表示ロジック
// =====================================

// ブックマークリストをHTMLに描画する関数
function renderBookmarks() {
    bookmarkList.innerHTML = ''; // 一度リストの中身をクリア

    if (bookmarks.length === 0) {
        bookmarkList.innerHTML = '<p class="no-bookmarks">まだブックマークがありません。新しいURLを登録してみましょう！</p>';
        return;
    }

    bookmarks.slice().reverse().forEach(bookmark => {
        const li = document.createElement('li');
        const titleText = bookmark.title || bookmark.url;
        const registeredDate = bookmark.registeredAt.toLocaleDateString();

        li.innerHTML = `
            <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="bookmark-link" data-url="${bookmark.url}">${titleText}</a>
            <div class="url-display">${bookmark.url}</div>
            <div class="meta-info">登録日: ${registeredDate}</div>
            <button class="delete-button" data-id="${bookmark.id}">削除</button>
        `;

        const bookmarkLink = li.querySelector('.bookmark-link');
        bookmarkLink.addEventListener('click', (event) => {
            event.preventDefault();
            currentNavigatingUrl = event.currentTarget.href;
            urlWarningModal.style.display = 'flex';
        });

        const deleteButton = li.querySelector('.delete-button');
        deleteButton.addEventListener('click', (event) => {
            const idToDelete = event.currentTarget.dataset.id;
            if (confirm('本当にこのブックマークを削除しますか？')) {
                deleteBookmark(idToDelete);
            }
        });

        bookmarkList.appendChild(li);
    });
}

// 個別のブックマークを削除する関数
function deleteBookmark(id) {
    bookmarks = bookmarks.filter(bm => bm.id !== id);
    saveBookmarks();
    renderBookmarks();
    updateAlerts(); // アラートも更新
}

// =====================================
// 4. モーダル表示/非表示のロジック
// =====================================

// URL登録モーダルを表示
showAddFormButton.addEventListener('click', () => {
    addBookmarkModal.style.display = 'flex'; // flexを使って中央揃え
    urlInput.focus(); // URL入力欄にフォーカス
});

// 閉じるボタンでモーダルを非表示
closeButton.addEventListener('click', () => {
    addBookmarkModal.style.display = 'none';
});

// 各モーダルの外側をクリックで非表示にする汎用ロジック
window.addEventListener('click', (event) => {
    if (event.target === addBookmarkModal) {
        addBookmarkModal.style.display = 'none';
    }
    // 警告モーダルも外側クリックで閉じる (nullチェックを追加)
    if (urlWarningModal && event.target === urlWarningModal) { 
        urlWarningModal.style.display = 'none';
    }
    // ★追加：設定モーダルも外側クリックで閉じる★
    if (settingsModal && event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
    // ★追加：タイトルプロンプトモーダルも外側クリックで閉じる★
    if (titlePromptModal && event.target === titlePromptModal) {
        titlePromptModal.style.display = 'none';
    }
});

// URL遷移警告モーダルのボタンイベント
if (confirmGoButton) {
    confirmGoButton.addEventListener('click', () => {
        if (currentNavigatingUrl) {
            window.open(currentNavigatingUrl, '_blank');
        }
        urlWarningModal.style.display = 'none';
        currentNavigatingUrl = '';
    });
}

if (cancelGoButton) {
    cancelGoButton.addEventListener('click', () => {
        urlWarningModal.style.display = 'none';
        currentNavigatingUrl = '';
    });
}


// =====================================
// 5. 新規ブックマーク登録ロジック
// =====================================

// ★変更：ブックマークを実際に登録する共通関数を定義★
function addBookmark(url, title = '') {
    if (!url) {
        alert('URLがありません。');
        return false;
    }

    const protocolRegex = /^(https?:\/\/|ftp:\/\/|file:\/\/|\/\/)/;
    if (!protocolRegex.test(url)) {
        alert('URLの形式が正しくありません。https:// または http:// から始まる完全なURLを入力してください。');
        return false;
    }
    
    if (bookmarks.some(bm => bm.url === url)) {
        alert('このURLはすでに登録されています。');
        return false;
    }

    if (!title) {
        try {
            const urlObj = new URL(url);
            title = urlObj.hostname;
        } catch (e) {
            title = url;
        }
    }

    const newBookmark = {
        id: Date.now().toString(),
        url: url,
        title: title,
        registeredAt: new Date(),
        lastAccessed: null // 新しい仕様では使わない
    };

    bookmarks.push(newBookmark);
    saveBookmarks();
    renderBookmarks();
    updateAlerts();
    return true; // 登録成功
}

// フォームからの登録
addBookmarkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = urlInput.value.trim();
    const title = titleInput.value.trim();

    if (addBookmark(url, title)) { // 共通関数を呼び出し
        addBookmarkForm.reset();
        addBookmarkModal.style.display = 'none';
    }
});


// =====================================
// 6. ブックマークレットからのURL取得と自動登録
// =====================================
function handleBookmarkletInput() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookmarkletUrl = urlParams.get('url');
    let bookmarkletTitle = urlParams.get('title') || '';


    if (bookmarkletUrl) {
        // 重複チェックをここで最初に行う
        if (bookmarks.some(bm => bm.url === bookmarkletUrl)) {
            alert('このURLはすでに登録されています。');
            window.history.replaceState(null, '', window.location.pathname); // URLパラメータをクリア
            return;
        }

        // タイトルがなければタイトル入力モーダルを表示
        if (!bookmarkletTitle) {
            titlePromptInput.value = ''; // 入力欄をクリア
            titlePromptModal.style.display = 'flex';
            titlePromptInput.focus();
            
            // モーダルの確定/スキップボタンにイベントリスナーを追加 (一度だけ)
            // 既存のリスナーが重複しないように removeEventListener も検討
            titlePromptConfirmButton.onclick = () => {
                const finalTitle = titlePromptInput.value.trim() || bookmarkletTitle; // 入力値またはブックマークレットからのタイトル
                addBookmark(bookmarkletUrl, finalTitle);
                titlePromptModal.style.display = 'none';
                window.history.replaceState(null, '', window.location.pathname); // URLパラメータをクリア
            };
            titlePromptSkipButton.onclick = () => {
                addBookmark(bookmarkletUrl, ''); // タイトルなしで登録 (ドメインがタイトルになる)
                titlePromptModal.style.display = 'none';
                window.history.replaceState(null, '', window.location.pathname); // URLパラメータをクリア
            };

        } else {
            // タイトルがあればそのまま登録
            addBookmark(bookmarkletUrl, bookmarkletTitle);
            window.history.replaceState(null, '', window.location.pathname); // URLパラメータをクリア
        }
    }
}

// =====================================
// 7. 自動消滅ロジック
// =====================================
// グローバル変数としてミリ秒単位で保持されるように修正
let EXPIRATION_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // デフォルトは3日間のミリ秒

function checkAndCleanBookmarks() {
    const now = new Date();
    // アプリへの最終アクセス時刻から設定された消滅期間が過ぎていたら全消滅
    if (now.getTime() - lastAppAccessTime.getTime() > EXPIRATION_DURATION_MS) {
        if (bookmarks.length > 0) {
            const deletedCount = bookmarks.length;
            bookmarks = []; // 全てのブックマークをクリア
            saveBookmarks();
            renderBookmarks();
            alert(`このアプリへの最終アクセスから設定された期間（${getDisplayDuration(EXPIRATION_DURATION_MS)}）が経過したため、${deletedCount}件のブックマークが全て消滅しました。`);
        }
    }
    updateAlerts(); // クリーンアップ後、アラートも更新
}

// =====================================
// 8. もうすぐ消滅するアラート機能
// =====================================
// グローバル変数としてミリ秒単位で保持されるように修正
let ALERT_THRESHOLD_MS = 1 * 24 * 60 * 60 * 1000; // デフォルトは1日前のミリ秒

function updateAlerts() {
    const now = new Date();
    // 消滅までの残り時間（ミリ秒）
    const timeUntilExpiration = EXPIRATION_DURATION_MS - (now.getTime() - lastAppAccessTime.getTime());

    if (timeUntilExpiration <= ALERT_THRESHOLD_MS && timeUntilExpiration > 0) {
        alertArea.style.display = 'block';
        let message = '';
        if (timeUntilExpiration < 1000 * 60) { // 1分以内
            const remainingSeconds = Math.ceil(timeUntilExpiration / 1000);
            message = `このアプリのブックマークはあと約 ${remainingSeconds} 秒で消滅します！`;
        } else if (timeUntilExpiration < 1000 * 60 * 60) { // 1時間以内
            const remainingMinutes = Math.ceil(timeUntilExpiration / (1000 * 60));
            message = `このアプリのブックマークはあと約 ${remainingMinutes} 分で消滅します！`;
        } else if (timeUntilExpiration < 1000 * 60 * 60 * 24) { // 1日以内
            const remainingHours = Math.ceil(timeUntilExpiration / (1000 * 60 * 60));
            message = `このアプリのブックマークはあと約 ${remainingHours} 時間で消滅します！`;
        } else { // 1日以上
            const remainingDays = Math.ceil(timeUntilExpiration / (1000 * 60 * 60 * 24));
            message = `このアプリのブックマークはあと約 ${remainingDays} 日で消滅します！`;
        }
        alertArea.innerHTML = `<p>${message}</p>`;
    } else {
        alertArea.style.display = 'none';
    }
}

// ミリ秒数を適切な表示単位に変換するヘルパー関数 (アラートメッセージ用)
function getDisplayDuration(ms) {
    const sec = 1000;
    const min = sec * 60;
    const hour = min * 60;
    const day = hour * 24;
    const month = day * 30.44; // 平均的な月の日数
    const year = day * 365.25; // 平均的な年 (うるう年考慮)

    if (ms >= year) {
        return `${Math.round(ms / year)}年`;
    } else if (ms >= month) {
        return `${Math.round(ms / month)}ヶ月`;
    } else if (ms >= day) {
        return `${Math.round(ms / day)}日`;
    } else if (ms >= hour) {
        return `${Math.round(ms / hour)}時間`;
    } else if (ms >= min) {
        return `${Math.round(ms / min)}分`;
    } else if (ms >= sec) {
        return `${Math.round(ms / sec)}秒`;
    } else {
        return `${ms}ミリ秒`; // または「0秒」など
    }
}


// =====================================
// 9. 初期化処理
// =====================================
// script.js の末尾近くにある初期化処理部分を修正

document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // 設定をロード
    loadLastAccessTime(); // アプリ最終アクセス時刻をロード
    loadBookmarks(); // ★★★ 保存されたブックマークを読み込む処理を追加 ★★★
    
    // アプリ起動時に現在時刻を最終アクセス時刻とする
    lastAppAccessTime = new Date(); 
    saveLastAccessTime();

    checkAndCleanBookmarks(); // 期限切れのブックマークを削除
    renderBookmarks(); // ブックマークを表示
    handleBookmarkletInput(); // ブックマークレットからの入力を処理
    updateAlerts(); // 初回アラート表示
});

// 定期的に消滅チェックとアラート更新 (例: 1分ごと)
setInterval(() => {
    checkAndCleanBookmarks();
    updateAlerts();
}, 60 * 1000); // 1分ごと (60秒 * 1000ミリ秒)

// 広告の表示（Google AdSenseのコードをここに埋め込むことを想定）
// adFooter.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-xxxxxxxxxxxxxxxx" data-ad-slot="yyyyyyyyyy"></ins>';
// (adsbygoogle = window.adsbygoogle || []).push({});
// 上記は実際のGoogle AdSenseコードの例です。現時点ではコメントアウトしておくか、
// HTMLのプレースホルダーdivで表示しておきます。
// 実際の広告コードを埋め込む際は、adFooter.innerHTML を置き換えてください。

// =====================================
// 10. 設定画面のロジック
// =====================================
// HTML要素は冒頭で定義済み

// 設定値を保存する変数（初期値はデフォルト設定）
let userSettings = {
    expirationValue: 3, // デフォルト値
    expirationUnit: 'days', // デフォルト単位
    alertValue: 1, // デフォルト値
    alertUnit: 'days' // デフォルト単位
};

// 単位に応じたミリ秒数を計算するヘルパー関数
function convertToMilliseconds(value, unit) {
    const ms = 1;
    const sec = ms * 1000;
    const min = sec * 60;
    const hour = min * 60;
    const day = hour * 24;
    const month = day * 30.44; // 平均的な月の日数 (365.25 / 12)
    const year = day * 365.25; // 平均的な年 (うるう年考慮)

    switch (unit) {
        case 'seconds': return value * sec;
        case 'minutes': return value * min;
        case 'hours':   return value * hour;
        case 'days':    return value * day;
        case 'months':  return value * month;
        case 'years':   return value * year;
        default: return 0;
    }
}

// 設定をローカルストレージに保存する関数
function saveSettings() {
    localStorage.setItem('volatileBookmarkSettings', JSON.stringify(userSettings));
    console.log('設定を保存しました。', userSettings);
}

// ローカルストレージから設定を読み込む関数
function loadSettings() {
    const savedSettings = localStorage.getItem('volatileBookmarkSettings');
    if (savedSettings) {
        userSettings = JSON.parse(savedSettings);
        // ロードした設定を反映
        // 数値入力欄と単位選択に値をセット
        if (expirationValueInput) expirationValueInput.value = userSettings.expirationValue;
        if (expirationUnitSelect) expirationUnitSelect.value = userSettings.expirationUnit;
        if (alertValueInput) alertValueInput.value = userSettings.alertValue;
        if (alertUnitSelect) alertUnitSelect.value = userSettings.alertUnit;
        
        // グローバル変数 EXPIRATION_DURATION_MS と ALERT_THRESHOLD_MS をミリ秒単位で更新
        EXPIRATION_DURATION_MS = convertToMilliseconds(userSettings.expirationValue, userSettings.expirationUnit);
        ALERT_THRESHOLD_MS = convertToMilliseconds(userSettings.alertValue, userSettings.alertUnit);
        
        console.log('設定を読み込みました。', userSettings);
    } else {
        // デフォルト設定をグローバル変数に変換
        EXPIRATION_DURATION_MS = convertToMilliseconds(userSettings.expirationValue, userSettings.expirationUnit);
        ALERT_THRESHOLD_MS = convertToMilliseconds(userSettings.alertValue, userSettings.alertUnit);
    }
}

// 設定モーダル表示
if (showSettingsButton) {
    showSettingsButton.addEventListener('click', () => {
        // 現在の設定値をフォームに反映
        expirationValueInput.value = userSettings.expirationValue;
        expirationUnitSelect.value = userSettings.expirationUnit;
        alertValueInput.value = userSettings.alertValue;
        alertUnitSelect.value = userSettings.alertUnit;
        
        settingsModal.style.display = 'flex';
    });
}

// 設定モーダルを閉じる
if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
}

// 設定フォームの送信処理
if (settingsForm) {
    settingsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // 入力値と選択された単位を取得
        const newExpirationValue = parseInt(expirationValueInput.value, 10);
        const newExpirationUnit = expirationUnitSelect.value;
        const newAlertValue = parseInt(alertValueInput.value, 10); 
        const newAlertUnit = alertUnitSelect.value;

        // ユーザー設定オブジェクトを更新
        userSettings.expirationValue = newExpirationValue;
        userSettings.expirationUnit = newExpirationUnit;
        userSettings.alertValue = newAlertValue;
        userSettings.alertUnit = newAlertUnit;

        // グローバル変数をミリ秒単位で更新
        EXPIRATION_DURATION_MS = convertToMilliseconds(newExpirationValue, newExpirationUnit);
        ALERT_THRESHOLD_MS = convertToMilliseconds(newAlertValue, newAlertUnit);

        saveSettings(); // 設定を保存
        settingsModal.style.display = 'none'; // モーダルを閉じる

        // 設定変更後、ブックマークリストとアラートを再評価
        checkAndCleanBookmarks();
        renderBookmarks();
        updateAlerts();
        
        alert('設定が保存されました。');
    });
}