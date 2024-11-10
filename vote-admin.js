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

// 添加選項輸入框
function addOptionInput() {
    const container = document.getElementById('optionsContainer');
    const optionCount = container.getElementsByClassName('option-input').length;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input flex items-center space-x-2';
    optionDiv.innerHTML = `
        <input type="text" placeholder="選項 ${optionCount + 1}" 
               class="flex-grow px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
        <button type="button" onclick="this.parentElement.remove()" 
                class="text-red-500 hover:text-red-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;
    
    container.appendChild(optionDiv);
}

// 獲取所有選項
function getOptions() {
    const options = {};
    document.querySelectorAll('.option-input input').forEach((input, index) => {
        if (input.value.trim()) {
            options[`option${index + 1}`] = {
                text: input.value.trim(),
                votes: 0
            };
        }
    });
    return options;
}

// 添加通知函數
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationIcon = document.getElementById('notificationIcon');
    
    // 設置圖標
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
    const iconSvg = type === 'success' ? 
        `<svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>` :
        `<svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>`;
    
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
}

// 處理新增投票
async function handleNewVote(event) {
    event.preventDefault();
    
    const voteData = {
        title: document.getElementById('voteTitle').value,
        description: document.getElementById('voteDescription').value,
        options: getOptions(),
        endTime: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('endTime').value)),
        createdAt: firebase.firestore.Timestamp.fromDate(new Date()),
        totalVotes: 0
    };

    try {
        await db.collection('votes').add(voteData);
        showNotification('投票創建成功！');
        loadVoteManagement();
        event.target.reset();
        document.getElementById('optionsContainer').innerHTML = '';
    } catch (error) {
        console.error("Error creating vote:", error);
        showNotification('創建失敗，請稍後再試', 'error');
    }
}

// 載入投票管理列表
async function loadVoteManagement() {
    try {
        const querySnapshot = await db.collection('votes').orderBy('createdAt', 'desc').get();
        const container = document.getElementById('voteManagementList');
        container.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const voteData = doc.data();
            const card = createManagementCard(doc.id, voteData);
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading votes:", error);
    }
}

// 創建管理卡片
function createManagementCard(voteId, voteData) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-xl p-6';
    
    const endTime = voteData.endTime.toDate();
    const isExpired = endTime < new Date();
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-gray-800">${voteData.title}</h3>
            <span class="px-4 py-1 rounded-full text-sm font-semibold ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                ${isExpired ? '已結束' : '進行中'}
            </span>
        </div>
        <p class="text-gray-600 mb-4">${voteData.description}</p>
        <div class="text-sm text-gray-500">
            結束時間: ${endTime.toLocaleString()}
        </div>
        <div class="text-sm text-gray-500 mb-4">
            總投票數: ${voteData.totalVotes}
        </div>
        <div class="space-y-2">
            ${Object.entries(voteData.options).map(([key, option]) => `
                <div class="flex justify-between items-center">
                    <span class="text-gray-700">${option.text}</span>
                    <span class="text-indigo-600 font-medium">${option.votes} 票</span>
                </div>
            `).join('')}
        </div>
        <div class="mt-4 flex justify-end">
            <button onclick="deleteVote('${voteId}')" class="px-4 py-2 rounded-xl text-white font-semibold bg-red-500 hover:bg-red-600 transform transition-all hover:scale-105">
                刪除投票
            </button>
        </div>
    `;
    
    return card;
}

// 刪除投票
async function deleteVote(voteId) {
    try {
        await db.collection('votes').doc(voteId).delete();
        showNotification('刪除成功！');
        loadVoteManagement();
    } catch (error) {
        console.error("Error deleting vote:", error);
        showNotification('刪除失敗，請稍後再試', 'error');
    }
}

// 載入投票請求
async function loadVoteRequests() {
    try {
        const querySnapshot = await db.collection('vote_requests')
            .orderBy('createdAt', 'desc')
            .get();
        
        const container = document.getElementById('voteRequestsList');
        container.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const requestData = doc.data();
            const card = createRequestCard(doc.id, requestData);
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading vote requests:", error);
    }
}

// 修改創建請求卡片函數
function createRequestCard(requestId, requestData) {
    const card = document.createElement('div');
    card.className = 'border-2 border-gray-200 rounded-xl p-4';
    
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };

    const statusText = {
        pending: '待審核',
        approved: '已通過',
        rejected: '已拒絕'
    };

    // 添加選項顯示
    const optionsHtml = requestData.options ? 
        Object.entries(requestData.options)
            .map(([key, option]) => `
                <div class="text-sm text-gray-600">- ${option.text}</div>
            `).join('') : '';

    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-semibold">${requestData.title}</h3>
            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[requestData.status]}">
                ${statusText[requestData.status]}
            </span>
        </div>
        <p class="text-gray-600 mb-2">${requestData.description}</p>
        <div class="mb-2">
            <div class="text-sm font-medium text-gray-700 mb-1">投票選項：</div>
            ${optionsHtml}
        </div>
        <p class="text-sm text-gray-500 mb-4">申請時間：${requestData.createdAt?.toDate().toLocaleString() || '未知'}</p>
        ${requestData.status === 'pending' ? `
            <div class="flex justify-end space-x-2">
                <button onclick="handleRequest('${requestId}', 'approved')" 
                        class="px-3 py-1 rounded-lg text-white bg-green-500 hover:bg-green-600">
                    通過
                </button>
                <button onclick="handleRequest('${requestId}', 'rejected')"
                        class="px-3 py-1 rounded-lg text-white bg-red-500 hover:bg-red-600">
                    拒絕
                </button>
            </div>
        ` : ''}
    `;
    
    return card;
}

// 處理請求審核
async function handleRequest(requestId, status) {
    try {
        const requestRef = db.collection('vote_requests').doc(requestId);
        const requestDoc = await requestRef.get();
        const requestData = requestDoc.data();

        await requestRef.update({
            status: status,
            processedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (status === 'approved') {
            const endTime = new Date();
            endTime.setHours(endTime.getHours() + 24);

            const options = {};
            Object.entries(requestData.options).forEach(([key, option]) => {
                options[key] = {
                    text: option.text,
                    votes: 0
                };
            });

            const voteData = {
                title: requestData.title,
                description: requestData.description,
                options: options,
                endTime: firebase.firestore.Timestamp.fromDate(endTime),
                createdAt: firebase.firestore.Timestamp.fromDate(new Date()),
                totalVotes: 0
            };

            await db.collection('votes').add(voteData);
            showNotification('已通過申請並創建投票！');
        } else {
            showNotification('已拒絕申請');
        }
        
        loadVoteRequests();
        loadVoteManagement();
    } catch (error) {
        console.error("Error handling request:", error);
        showNotification('處理失敗，請稍後再試', 'error');
    }
}

// 修改載入待審核的留言函數
async function loadPendingComments() {
    const container = document.getElementById('commentsManagementList');
    if (!container) {
        console.error('Comments management container not found');
        return;
    }

    try {
        // 顯示載入中狀態
        container.innerHTML = '<div class="text-center py-4 text-gray-500">載入中...</div>';

        const querySnapshot = await db.collection('comments')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();

        container.innerHTML = '';

        if (querySnapshot.empty) {
            container.innerHTML = '<div class="text-center py-4 text-gray-500">暫無待審核的留言</div>';
            return;
        }

        querySnapshot.forEach(doc => {
            const commentData = doc.data();
            const card = createCommentCard(doc.id, commentData);
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
        
        // 如果是索引錯誤，顯示友好的提示
        if (error.code === 'failed-precondition') {
            container.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-gray-500 mb-2">系統正在準備中，請稍後再試...</p>
                    <p class="text-sm text-gray-400">（首次使用需要一些時間建立索引）</p>
                </div>
            `;
        } else {
            container.innerHTML = '<div class="text-center py-4 text-red-500">載入失敗，請稍後再試</div>';
        }
    }
}

// 修改創建留言管理卡片函數
function createCommentCard(commentId, commentData) {
    const card = document.createElement('div');
    card.className = 'border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors';

    const time = commentData.createdAt.toDate();
    const formattedTime = time.toLocaleString('zh-TW');

    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <div>
                <h3 class="text-lg font-semibold">${commentData.nickname}</h3>
                <p class="text-sm text-gray-500">留言時間：${formattedTime}</p>
                <p class="text-sm text-gray-500">IP：${commentData.userIP || '未知'}</p>
                <p class="text-sm text-gray-500">投票ID：${commentData.voteId || '未知'}</p>
                <p class="text-sm text-gray-500">讚數：${commentData.likes || 0}</p>
            </div>
            <div class="flex space-x-2">
                <button onclick="handleComment('${commentId}', 'approved')" 
                        class="px-3 py-1 rounded-lg text-white bg-green-500 hover:bg-green-600 transition-colors">
                    通過
                </button>
                <button onclick="handleComment('${commentId}', 'rejected')"
                        class="px-3 py-1 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors">
                    拒絕
                </button>
                <button onclick="deleteComment('${commentId}')"
                        class="px-3 py-1 rounded-lg text-white bg-gray-500 hover:bg-gray-600 transition-colors">
                    刪除
                </button>
            </div>
        </div>
        <p class="text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">${commentData.content}</p>
    `;

    return card;
}

// 添加刪除留言功能
async function deleteComment(commentId) {
    if (!confirm('確定要刪除這則留言嗎？')) {
        return;
    }

    try {
        // 刪除留言
        await db.collection('comments').doc(commentId).delete();
        
        // 刪除相關的點讚記錄
        const likesSnapshot = await db.collection('comment_likes')
            .where('commentId', '==', commentId)
            .get();
        
        const batch = db.batch();
        likesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        showNotification('留言已刪除');
        loadPendingComments();
    } catch (error) {
        console.error("Error deleting comment:", error);
        showNotification('刪除失敗，請稍後再試', 'error');
    }
}

// 處理留言審核
async function handleComment(commentId, status) {
    try {
        await db.collection('comments').doc(commentId).update({
            status: status,
            processedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification(status === 'approved' ? '已通過留言' : '已拒絕留言');
        loadPendingComments();
    } catch (error) {
        console.error("Error handling comment:", error);
        showNotification('處理失敗，請稍後再試', 'error');
    }
}

// 將函數添加到全局作用域
window.addOptionInput = addOptionInput;
window.deleteVote = deleteVote;
window.handleRequest = handleRequest;
window.handleComment = handleComment;
window.deleteComment = deleteComment;

// 初始化頁面
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newVoteForm');
    form.addEventListener('submit', handleNewVote);
    
    const addOptionBtn = document.getElementById('addOption');
    addOptionBtn.addEventListener('click', addOptionInput);
    
    loadVoteManagement();
    loadVoteRequests();
    loadPendingComments();
}); 