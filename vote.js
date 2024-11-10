// 移除 import 語句，改用全局 firebase 對象
const firebaseConfig = {
    apiKey: "AIzaSyDskqG0dx4rkK6x6Jt_h2CzDhYYfqzdFF4",
    authDomain: "tmjhnew.firebaseapp.com",
    databaseURL: "https://tmjhnew-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tmjhnew",
    storageBucket: "tmjhnew.firebasestorage.app",
    messagingSenderId: "624200299812",
    appId: "1:624200299812:web:a0dea7f6829fffe124efb1",
    measurementId: "G-ZPV4SKNZBV"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 添加獲取用戶 IP 的函數
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error getting IP:", error);
        return null;
    }
}

// 修改載入投票列表函數
async function loadVotes() {
    const votesRef = db.collection('votes');
    const q = votesRef.where('endTime', '>', new Date());
    
    try {
        const querySnapshot = await q.get();
        const voteList = document.getElementById('voteList');
        voteList.innerHTML = '';

        // 使用 Promise.all 等待所有卡片創建完成
        const voteCards = await Promise.all(
            querySnapshot.docs.map(async doc => {
                const voteData = doc.data();
                return await createVoteCard(doc.id, voteData);
            })
        );

        // 將所有卡片添加到列表中
        voteCards.forEach(card => {
            voteList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading votes:", error);
    }
}

// 修改創建投票卡片函數
async function createVoteCard(voteId, voteData) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-xl p-8 mb-8';
    
    // 檢查用戶是否已點讚
    const hasLiked = await checkIfUserLiked(voteId);
    const formattedEndTime = new Date(voteData.endTime.seconds * 1000).toLocaleString('zh-TW');
    
    // 獲取留言數量
    const commentsCount = await getCommentsCount(voteId);
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold flex-grow">${voteData.title}</h2>
            <div class="flex space-x-2">
                <!-- 留言按鈕 -->
                <button data-toggle-comments data-vote-id="${voteId}" 
                        class="comment-button group p-2 rounded-xl border-2 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-300 flex items-center space-x-1">
                    <svg class="w-5 h-5 text-gray-500 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    <span class="text-sm text-gray-500 group-hover:text-indigo-500">${commentsCount}</span>
                </button>
                <!-- 點讚按鈕 -->
                <button data-like-button data-vote-id="${voteId}" 
                        class="like-button p-2 rounded-xl border-2 ${hasLiked ? 'liked' : ''} hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    <span class="likes-count text-sm ml-1">${voteData.likes || 0}</span>
                </button>
            </div>
        </div>
        <p class="text-gray-600 mb-4">${voteData.description}</p>
        <p class="text-sm text-gray-500 mb-6">結束時間：${formattedEndTime}</p>
        
        <div class="space-y-4" id="options-${voteId}">
            ${createOptionsHTML(voteId, voteData.options, voteData.totalVotes)}
        </div>

        <!-- 留言區塊（預設隱藏） -->
        <div id="comments-section-${voteId}" class="hidden mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-semibold mb-4">留言區</h3>
            <div class="space-y-4 mb-6" id="comments-${voteId}">
                <!-- 留言將動態載入 -->
            </div>
            
            <!-- 留言表單 -->
            <form onsubmit="handleComment(event, '${voteId}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">您的暱稱</label>
                    <input type="text" name="nickname" required
                           class="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                           placeholder="請輸入暱稱">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">留言內容</label>
                    <textarea name="content" required rows="3"
                              class="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              placeholder="分享您的想法..."></textarea>
                </div>
                <div class="flex justify-end">
                    <button type="submit" 
                            class="px-6 py-2 rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 transform transition-all hover:scale-105">
                        送出留言
                    </button>
                </div>
            </form>
        </div>
    `;

    return card;
}

// 添加切換留言區塊的函數
async function toggleComments(voteId) {
    const commentsSection = document.getElementById(`comments-section-${voteId}`);
    const commentButton = document.querySelector(`button[data-toggle-comments][data-vote-id="${voteId}"]`);
    const isHidden = commentsSection.classList.contains('hidden');
    
    if (isHidden) {
        commentsSection.classList.remove('hidden');
        // 更新留言數量
        const count = await getCommentsCount(voteId);
        const countSpan = commentButton.querySelector('span');
        if (countSpan) {
            countSpan.textContent = count;
        }
        loadComments(voteId);
    } else {
        commentsSection.classList.add('hidden');
    }
}

// 修改載入留言函數
async function loadComments(voteId) {
    try {
        const commentsContainer = document.getElementById(`comments-${voteId}`);
        if (!commentsContainer) {
            console.error(`Comments container not found for vote ${voteId}`);
            return;
        }

        commentsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">載入中...</p>';

        const userIP = await getUserIP();
        const querySnapshot = await db.collection('comments')
            .where('voteId', '==', voteId)
            .where('status', '==', 'approved')
            .orderBy('createdAt', 'desc')
            .get();

        commentsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            commentsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">暫無留言</p>';
            return;
        }

        // 獲取用戶的點讚狀態
        const likePromises = querySnapshot.docs.map(async doc => {
            if (userIP) {
                const likeDoc = await db.collection('comment_likes')
                    .doc(`${doc.id}_${userIP}`)
                    .get();
                return likeDoc.exists;
            }
            return false;
        });

        const likeStatuses = await Promise.all(likePromises);

        querySnapshot.docs.forEach((doc, index) => {
            const commentData = doc.data();
            commentData.userLiked = likeStatuses[index];
            const commentElement = createCommentElement(commentData, doc.id);
            commentsContainer.appendChild(commentElement);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
        if (commentsContainer) {
            commentsContainer.innerHTML = '<p class="text-red-500 text-center py-4">載入失敗，請稍後再試</p>';
        }
    }
}

// 修改創建選項 HTML 的函數
function createOptionsHTML(voteId, options, totalVotes) {
    return Object.entries(options).map(([optionId, option]) => {
        const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
        return `
            <div class="option-container mb-4 relative">
                <button data-vote-button data-vote-id="${voteId}" data-option-id="${optionId}" 
                        class="vote-button w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 flex justify-between items-center group">
                    <span class="text-lg font-medium text-gray-700 group-hover:text-indigo-600">${option.text}</span>
                    <div class="flex items-center space-x-2 absolute right-4">
                        <span class="text-sm font-semibold text-indigo-600">${option.votes} 票 (${percentage}%)</span>
                        <svg class="loading-spinner w-5 h-5 text-indigo-600 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <svg class="vote-success w-5 h-5 text-green-500 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                </button>
                <div class="relative mt-2">
                    <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                             style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 修改投票處理函數
async function handleVote(voteId, optionId) {
    const button = document.querySelector(`button[data-vote-button][data-vote-id="${voteId}"][data-option-id="${optionId}"]`);
    if (!button) return;

    // 添加載入狀態
    button.classList.add('loading');
    button.disabled = true;

    try {
        const userIP = await getUserIP();
        if (!userIP) {
            throw new Error('無法獲取IP地址');
        }

        const voteRef = db.collection('votes').doc(voteId);
        const ipRef = db.collection('vote_ips').doc(`${voteId}_${userIP}`);

        // 檢查是否已經投票
        const ipDoc = await ipRef.get();
        if (ipDoc.exists) {
            throw new Error('您已經參與過此投票');
        }

        let updatedVoteData;
        await db.runTransaction(async (transaction) => {
            const voteDoc = await transaction.get(voteRef);
            if (!voteDoc.exists) {
                throw new Error("投票不存在");
            }

            const voteData = voteDoc.data();
            
            if (new Date(voteData.endTime.toDate()) < new Date()) {
                throw new Error("投票已結束");
            }

            voteData.options[optionId].votes++;
            voteData.totalVotes++;

            transaction.update(voteRef, voteData);
            transaction.set(ipRef, {
                ip: userIP,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                voteId: voteId,
                optionId: optionId
            });

            updatedVoteData = voteData;
        });

        // 更新當前投票卡片的數據
        updateVoteCard(voteId, updatedVoteData);

        // 顯示
        button.classList.remove('loading');
        const successIcon = button.querySelector('.vote-success');
        successIcon.classList.remove('hidden');
        successIcon.classList.add('show');

        showNotification('投票成功！');

    } catch (error) {
        console.error("Error voting:", error);
        button.classList.remove('loading');
        button.disabled = false;
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'text-red-500 text-sm ml-2';
        errorSpan.textContent = error.message;
        button.parentNode.appendChild(errorSpan);
        setTimeout(() => errorSpan.remove(), 3000);

        showNotification('投票失敗，請稍後再試', 'error');
    }
}

// 添加更新投票卡片的函數
function updateVoteCard(voteId, voteData) {
    const optionsContainer = document.getElementById(`options-${voteId}`);
    if (!optionsContainer) return;

    // 只更新選項的投票數和百分比
    Object.entries(voteData.options).forEach(([optionId, option]) => {
        const percentage = voteData.totalVotes > 0 ? (option.votes / voteData.totalVotes * 100).toFixed(1) : 0;
        
        // 更新投票數和百分比文字
        const voteCountSpan = optionsContainer.querySelector(`button[data-vote-button][data-vote-id="${voteId}"][data-option-id="${optionId}"] .text-sm`);
        if (voteCountSpan) {
            voteCountSpan.textContent = `${option.votes} 票 (${percentage}%)`;
        }

        // 更新進度條
        const progressBar = optionsContainer.querySelector(`button[data-vote-button][data-vote-id="${voteId}"][data-option-id="${optionId}"]`)
            .nextElementSibling.querySelector('.bg-gradient-to-r');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    });
}

// 修改點讚處理函數
async function handleLike(voteId) {
    try {
        const userIP = await getUserIP();
        if (!userIP) {
            throw new Error('無法獲取IP地址');
        }

        const voteRef = db.collection('votes').doc(voteId);
        const likeRef = db.collection('vote_likes').doc(`${voteId}_${userIP}`);
        const likeButton = document.querySelector(`button[data-like-button][data-vote-id="${voteId}"]`);
        const likeIcon = likeButton.querySelector('svg');
        
        // 添加點擊動畫
        likeButton.classList.add('scale-110');
        likeIcon.classList.add('scale-110');
        
        // 檢查是否已經點讚
        const likeDoc = await likeRef.get();
        
        await db.runTransaction(async (transaction) => {
            const voteDoc = await transaction.get(voteRef);
            if (!voteDoc.exists) {
                throw new Error("投票不存在");
            }

            const voteData = voteDoc.data();
            const currentLikes = voteData.likes || 0;

            if (likeDoc.exists) {
                // 取消點讚
                transaction.update(voteRef, {
                    likes: currentLikes - 1
                });
                transaction.delete(likeRef);
                likeButton.classList.remove('liked', 'bg-pink-50');
                likeIcon.classList.remove('text-pink-500', 'fill-current');
            } else {
                // 添加點讚
                transaction.update(voteRef, {
                    likes: currentLikes + 1
                });
                transaction.set(likeRef, {
                    ip: userIP,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    voteId: voteId
                });
                likeButton.classList.add('liked', 'bg-pink-50');
                likeIcon.classList.add('text-pink-500', 'fill-current');
            }

            // 更新點讚數
            const likesCount = likeButton.querySelector('.likes-count');
            if (likesCount) {
                likesCount.textContent = likeDoc.exists ? currentLikes - 1 : currentLikes + 1;
            }
        });

        // 重置動畫
        setTimeout(() => {
            likeButton.classList.remove('scale-110');
            likeIcon.classList.remove('scale-110');
        }, 200);

    } catch (error) {
        console.error("Error handling like:", error);
    }
}

// 將 handleVote 函數添加到全局作用域
window.handleVote = handleVote;

// 將點讚函數添加到全局作用域
window.handleLike = handleLike;

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
    loadVotes();
});

// Modal 控制函數
function showRequestVoteModal() {
    const modal = document.getElementById('requestVoteModal');
    modal.classList.remove('hidden');
    // 防止背景滾動
    document.body.style.overflow = 'hidden';
}

function hideRequestVoteModal() {
    const modal = document.getElementById('requestVoteModal');
    modal.classList.add('hidden');
    // 恢復背景滾動
    document.body.style.overflow = '';
}

// 點擊背景關閉 Modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('requestVoteModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('bg-opacity-50')) {
            hideRequestVoteModal();
        }
    });
});

// 添加選項輸入框到請求表單
function addRequestOption() {
    const container = document.getElementById('requestOptionsContainer');
    const optionCount = container.children.length;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'flex items-center space-x-2';
    optionDiv.innerHTML = `
        <input type="text" placeholder="選項 ${optionCount + 1}" 
               class="flex-grow px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" required>
        <button type="button" onclick="this.parentElement.remove()" 
                class="text-red-500 hover:text-red-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;
    
    container.appendChild(optionDiv);
}

// 修改通知函數
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationIcon = document.getElementById('notificationIcon');
    
    // 檢查元素是否存在
    if (!notification || !notificationText || !notificationIcon) {
        console.error('找不到通知元素');
        return;
    }
    
    // 設置圖標
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
    const iconSvg = type === 'success' ? 
        `<svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>` :
        `<svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>`;
    
    try {
        notificationIcon.innerHTML = iconSvg;
        notificationText.textContent = message;
        
        // 顯示通知
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
        
        // 3秒後隱藏
        setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
        }, 3000);
    } catch (error) {
        console.error('顯示通知時發生錯誤:', error);
    }
}

// 修改處理投票請求函數
async function handleVoteRequest(event) {
    event.preventDefault();
    
    const optionsContainer = document.getElementById('requestOptionsContainer');
    const optionInputs = optionsContainer.querySelectorAll('input');
    const options = {};
    
    if (optionInputs.length < 2) {
        showNotification('請至少添加兩個選項', 'error');
        return;
    }

    optionInputs.forEach((input, index) => {
        if (input.value.trim()) {
            options[`option${index + 1}`] = {
                text: input.value.trim()
            };
        }
    });
    
    const requestData = {
        title: document.getElementById('requestTitle').value,
        description: document.getElementById('requestDescription').value,
        options: options,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        userIP: await getUserIP()
    };

    try {
        await db.collection('vote_requests').add(requestData);
        showNotification('申請已送出！我們會盡快審核您的申請。');
        hideRequestVoteModal();
        event.target.reset();
        document.getElementById('requestOptionsContainer').innerHTML = '';
    } catch (error) {
        console.error("Error submitting vote request:", error);
        showNotification('申請送出失敗，請稍後再試', 'error');
    }
}

// 添加投票請求表單的提交處理
const requestForm = document.getElementById('requestVoteForm');
requestForm.addEventListener('submit', handleVoteRequest);

// 添加到全局作用域
window.showRequestVoteModal = showRequestVoteModal;
window.hideRequestVoteModal = hideRequestVoteModal;
window.addRequestOption = addRequestOption;

// 處理留言提交
async function handleComment(event, voteId) {
    event.preventDefault();
    const form = event.target;
    const nickname = form.querySelector('input').value;
    const content = form.querySelector('textarea').value;

    try {
        const commentData = {
            voteId: voteId,
            nickname: nickname,
            content: content,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userIP: await getUserIP()
        };

        await db.collection('comments').add(commentData);
        showNotification('留言已送出，待管理員審核後將會顯示');
        form.reset();

        // 更新留言按鈕上的數量
        const commentButton = document.querySelector(`button[data-toggle-comments][data-vote-id="${voteId}"]`);
        if (commentButton) {
            const count = await getCommentsCount(voteId);
            const countSpan = commentButton.querySelector('span');
            if (countSpan) {
                countSpan.textContent = count;
            }
        }
    } catch (error) {
        console.error("Error submitting comment:", error);
        showNotification('留言送出失敗，請稍後再試', 'error');
    }
}

// 修改創建留言元素函數
function createCommentElement(commentData, commentId) {
    const div = document.createElement('div');
    div.className = 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300';
    
    const time = commentData.createdAt.toDate();
    const formattedTime = time.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    div.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                    <span class="text-white font-bold text-lg">
                        ${commentData.nickname.charAt(0).toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-gray-900 text-lg">${commentData.nickname}</h4>
                    <div class="flex items-center space-x-2">
                        <button data-comment-like data-comment-id="${commentId}" 
                                class="comment-like-btn group flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-50 hover:bg-pink-50 transition-colors duration-300 ${commentData.userLiked ? 'bg-pink-50' : ''}">
                            <svg class="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors duration-300 ${commentData.userLiked ? 'text-pink-500 fill-current' : ''}" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                            <span class="text-sm text-gray-500 group-hover:text-pink-500 transition-colors duration-300">
                                ${commentData.likes || 0}
                            </span>
                        </button>
                        <span class="text-sm text-gray-400">${formattedTime}</span>
                    </div>
                </div>
                <p class="text-gray-600 leading-relaxed">${commentData.content}</p>
            </div>
        </div>
    `;

    return div;
}

// 修改留言點讚功能
async function handleCommentLike(commentId) {
    try {
        const userIP = await getUserIP();
        if (!userIP) {
            throw new Error('無法獲取IP地址');
        }

        const commentRef = db.collection('comments').doc(commentId);
        const likeRef = db.collection('comment_likes').doc(`${commentId}_${userIP}`);
        const likeButton = document.querySelector(`button[data-comment-like][data-comment-id="${commentId}"]`);
        
        // 添加點擊動畫
        likeButton.classList.add('scale-110');
        
        await db.runTransaction(async (transaction) => {
            const [commentDoc, likeDoc] = await Promise.all([
                transaction.get(commentRef),
                transaction.get(likeRef)
            ]);

            if (!commentDoc.exists) {
                throw new Error("留言不存在");
            }

            const commentData = commentDoc.data();
            const currentLikes = commentData.likes || 0;

            if (likeDoc.exists) {
                // 取消點讚
                transaction.update(commentRef, {
                    likes: currentLikes - 1
                });
                transaction.delete(likeRef);
                likeButton.classList.remove('bg-pink-50');
                likeButton.querySelector('svg').classList.remove('text-pink-500', 'fill-current');
            } else {
                // 添加點讚
                transaction.update(commentRef, {
                    likes: currentLikes + 1
                });
                transaction.set(likeRef, {
                    ip: userIP,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    commentId: commentId
                });
                likeButton.classList.add('bg-pink-50');
                likeButton.querySelector('svg').classList.add('text-pink-500', 'fill-current');
            }

            // 更新點讚數
            const likesCount = likeButton.querySelector('span');
            if (likesCount) {
                likesCount.textContent = likeDoc.exists ? currentLikes - 1 : currentLikes + 1;
            }
        });

        // 重置動畫
        setTimeout(() => {
            likeButton.classList.remove('scale-110');
        }, 200);

    } catch (error) {
        console.error("Error handling comment like:", error);
        showNotification('操作失敗，請稍後再試', 'error');
    }
}

// 將函數添加到全局作用域
window.handleCommentLike = handleCommentLike;

// 檢查用戶是否已點讚
async function checkIfUserLiked(voteId) {
    try {
        const userIP = await getUserIP();
        if (!userIP) return false;

        const likeRef = db.collection('vote_likes').doc(`${voteId}_${userIP}`);
        const likeDoc = await likeRef.get();
        
        return likeDoc.exists;
    } catch (error) {
        console.error("Error checking like status:", error);
        return false;
    }
}

// 將函數添加到全局作用域
window.checkIfUserLiked = checkIfUserLiked;

// 添加獲取留言數量的函數
async function getCommentsCount(voteId) {
    try {
        const snapshot = await db.collection('comments')
            .where('voteId', '==', voteId)
            .where('status', '==', 'approved')
            .get();
        return snapshot.size;
    } catch (error) {
        console.error("Error getting comments count:", error);
        return 0;
    }
}

// 添加手機版選單控制函數
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
    } else {
        mobileMenu.classList.add('hidden');
    }
}

// 將函數添加到全局作用域
window.toggleMobileMenu = toggleMobileMenu;

// 點擊其他地方關閉手機版選單
document.addEventListener('click', (e) => {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuButton = document.querySelector('button[onclick="toggleMobileMenu()"]');
    
    if (!mobileMenu.contains(e.target) && !menuButton.contains(e.target)) {
        mobileMenu.classList.add('hidden');
    }
});

// 添加導航欄控制函數
function initializeNavigation() {
    const sideNav = document.getElementById('sideNav');
    const toggleNav = document.getElementById('toggleNav');
    const toggleIcon = document.getElementById('toggleIcon');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMobileNav = document.getElementById('closeMobileNav');
    const navOverlay = document.getElementById('navOverlay');

    // 桌面版導航欄收縮控制
    toggleNav?.addEventListener('click', () => {
        sideNav.classList.toggle('collapsed');
        toggleIcon.style.transform = sideNav.classList.contains('collapsed') 
            ? 'rotate(180deg)' 
            : 'rotate(0deg)';
    });

    // 打開手機版選單
    mobileMenuBtn?.addEventListener('click', () => {
        sideNav.classList.remove('translate-x-full');
        navOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    // 關閉手機版選單
    const closeNav = () => {
        sideNav.classList.add('translate-x-full');
        navOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    };

    // 綁定關閉事件
    closeMobileNav?.addEventListener('click', closeNav);
    navOverlay?.addEventListener('click', closeNav);

    // 處理導航鏈接點擊
    const navLinks = sideNav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeNav();
            }
        });
    });
}

// 在頁面加載完成後初始化導航
document.addEventListener('DOMContentLoaded', initializeNavigation);

// 添加觸摸事件支持
function addTouchSupport(element) {
    element.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.click();
    }, { passive: false });
}

// 添加事件綁定初始化函數
function initializeEventListeners() {
    // 投票按鈕事件綁定
    document.querySelectorAll('[data-vote-button]').forEach(button => {
        const voteId = button.getAttribute('data-vote-id');
        const optionId = button.getAttribute('data-option-id');
        button.addEventListener('click', () => handleVote(voteId, optionId));
    });

    // 點讚按鈕事件綁定
    document.querySelectorAll('[data-like-button]').forEach(button => {
        const voteId = button.getAttribute('data-vote-id');
        button.addEventListener('click', () => handleLike(voteId));
    });

    // 留言點讚按鈕事件綁定
    document.querySelectorAll('[data-comment-like]').forEach(button => {
        const commentId = button.getAttribute('data-comment-id');
        button.addEventListener('click', () => handleCommentLike(commentId));
    });

    // 切換留言區塊按鈕事件綁定
    document.querySelectorAll('[data-toggle-comments]').forEach(button => {
        const voteId = button.getAttribute('data-vote-id');
        button.addEventListener('click', () => toggleComments(voteId));
    });

    // Modal 相關按鈕事件綁定
    const requestVoteButton = document.querySelector('[data-request-vote]');
    requestVoteButton?.addEventListener('click', showRequestVoteModal);

    const hideModalButton = document.querySelector('[data-hide-modal]');
    hideModalButton?.addEventListener('click', hideRequestVoteModal);

    const addOptionButton = document.querySelector('[data-add-option]');
    addOptionButton?.addEventListener('click', addRequestOption);

    // 為所有按鈕添加觸摸支持
    document.querySelectorAll('button').forEach(button => {
        addTouchSupport(button);
    });
}

// 在頁面加載完成後初始化所有事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeEventListeners();
});