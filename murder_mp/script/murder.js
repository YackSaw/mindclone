setTimeout(() => {
    // 要素を取得
    let ele = document.getElementById('clues');
    // 現在の visibility プロパティの値を保持
    const visibilityOriginal = ele.style.visibility;
    // hidden に設定して非表示
    //ele.style.visibility = 'hidden';
}, 1000 * 10);
