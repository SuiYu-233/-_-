
// ==UserScript==
// @name         播放器问题诊断-可视化版
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  强制显示元素，诊断播放器不显示问题
// @match        http://127.0.0.1:8000//*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 1. 立即弹窗，确认本脚本已启动
    alert('🔍 诊断脚本已启动。点击确定开始诊断。');
    
    // 2. 等待页面主体加载完成
    function waitForBody() {
        if (document.body) {
            startDiagnosis();
        } else {
            setTimeout(waitForBody, 100);
        }
    }
    
    function startDiagnosis() {
        // 3. 首先，我们创建一个绝对不可能看不见的测试元素
        const testMarker = document.createElement('div');
        testMarker.id = 'diag-test-marker';
        testMarker.innerHTML = '✅ 诊断点';
        testMarker.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            left: 20px !important;
            background-color: limegreen !important;
            color: black !important;
            padding: 15px !important;
            font-size: 18px !important;
            font-weight: bold !important;
            border: 3px solid red !important;
            border-radius: 10px !important;
            z-index: 999999999 !important;
            box-shadow: 0 0 15px yellow !important;
        `;
        document.body.appendChild(testMarker);
        alert('第一步：已在页面左上角添加了一个"绿色方块"文字。\n\n请现在查看页面左上角，是否能看到一个带有"✅ 诊断点"的绿底红框方块？\n\n看到请点"确定"继续。');
        
        // 4. 现在，检查原播放器元素是否存在
        const playerRoot = document.querySelector('.di-root');
        const playerIsland = document.querySelector('.di-player, .di-list');
        
        if (playerRoot || playerIsland) {
            // 情况A：找到了元素！说明元素已注入，但是不可见。
            alert('✅ 诊断结果：发现了播放器HTML元素！\n\n问题在于：元素存在，但被CSS样式隐藏了。\n\n接下来我将给它涂上红色，让它强制显示。');
            
            // 强制给播放器元素加上无法覆盖的样式
            const forceStyle = document.createElement('style');
            forceStyle.id = 'diag-force-style';
            forceStyle.textContent = `
                .di-root, .di-player, .di-list, [class*="di-"] {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    background: rgba(255, 0, 0, 0.6) !important;
                    border: 4px dashed yellow !important;
                    backdrop-filter: none !important;
                }
            `;
            document.head.appendChild(forceStyle);
            
            // 尝试将播放器元素移到body末尾，避免被父容器裁剪
            if (playerRoot && playerRoot.parentNode !== document.body) {
                document.body.appendChild(playerRoot);
            }
            
            alert('🎯 已强制注入红色高亮样式。\n\n请现在仔细查看页面顶部中央（大约向下68像素的位置），是否出现了一个带有"半透明红色背景"和"黄色虚线边框"的区域？\n\n如果看到，说明播放器就在那里，只是原样式有问题。如果还是看不到，可能是它的位置（top/left）设置错误，跑出屏幕了。');
            
        } else {
            // 情况B：没找到元素。说明原播放器脚本的HTML注入代码根本没执行，或者执行失败了。
            alert('❌ 诊断结果：在页面中未找到任何播放器HTML元素。\n\n这意味着：\n1. 原播放器脚本的创建和注入HTML的代码可能没有执行。\n2. 或执行过程中发生了错误而中断。\n3. 或元素被创建后立即移除了。\n\n请检查原播放器脚本的控制台是否有错误（如果可能），并确保其代码在修改@match后已完整执行。');
        }
        
        // 5. 最终总结提示
        setTimeout(() => {
            alert('📋 诊断流程结束。请根据上面每一步的弹窗提示和页面视觉反馈，确定问题属于哪一种情况。');
        }, 500);
    }
    
    // 启动等待流程
    waitForBody();
})();