document.addEventListener('DOMContentLoaded', () => {
    // Reveal elements on scroll
    const revealItems = document.querySelectorAll('.reveal-item');

    const revealObserverOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealObserverOptions);

    revealItems.forEach(item => {
        revealObserver.observe(item);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;

            // Close all others
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('open');
                    otherItem.querySelector('.accordion-content').style.maxHeight = null;
                }
            });

            // Toggle current
            item.classList.toggle('open');
            if (item.classList.contains('open')) {
                // Add an arbitrary buffer (e.g. 50px) to ensure padding is covered
                content.style.maxHeight = content.scrollHeight + 50 + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // Initial dummy calculation for display
    updateCalcs(false);
});

// Calculator Logic
function updateProb(choice, scene) {
    const mainProbInput = document.getElementById(`${choice}-prob-1`);
    const subProbInput = document.getElementById(`${choice}-prob-2`);

    let prob = parseFloat(mainProbInput.value);
    if (isNaN(prob) || prob < 0) prob = 0;
    if (prob > 100) prob = 100;

    mainProbInput.value = prob;
    subProbInput.value = 100 - prob;

    updateCalcs(false);
}

function updateCalcs(showWinner) {
    // Choice A values
    const aUtil1 = parseFloat(document.getElementById('a-util-1').value) || 0;
    const aProb1 = parseFloat(document.getElementById('a-prob-1').value) || 0;
    const aUtil2 = parseFloat(document.getElementById('a-util-2').value) || 0;
    const aProb2 = parseFloat(document.getElementById('a-prob-2').value) || 0;

    // Choice B values
    const bUtil1 = parseFloat(document.getElementById('b-util-1').value) || 0;
    const bProb1 = parseFloat(document.getElementById('b-prob-1').value) || 0;
    const bUtil2 = parseFloat(document.getElementById('b-util-2').value) || 0;
    const bProb2 = parseFloat(document.getElementById('b-prob-2').value) || 0;

    // Calculate E(x)
    const eA = (aUtil1 * (aProb1 / 100)) + (aUtil2 * (aProb2 / 100));
    const eB = (bUtil1 * (bProb1 / 100)) + (bUtil2 * (bProb2 / 100));

    // Update Display
    document.getElementById('a-result').textContent = eA.toFixed(1);
    document.getElementById('b-result').textContent = eB.toFixed(1);

    return { eA, eB };
}

function calculateWinner() {
    const { eA, eB } = updateCalcs(true);
    const winnerDisplay = document.getElementById('winner-display');
    const winnerText = document.getElementById('winner-text');
    const winnerDesc = document.getElementById('winner-desc');
    const meterFill = document.getElementById('meter-fill');

    winnerDisplay.classList.remove('hidden');
    winnerDisplay.classList.add('show');

    // Scroll to result softly
    setTimeout(() => {
        winnerDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    // Calculate meter percentage (normalize mapping A left to B right)
    // Range is rough, let's map it smoothly based on difference
    let totalAbs = Math.abs(eA) + Math.abs(eB);
    if (totalAbs === 0) totalAbs = 1;

    let percentage;
    if (eA > eB) {
        winnerText.innerHTML = `你的理性選擇是：<span class="highlight">選擇 A</span>`;
        winnerDesc.textContent = `在你的主觀世界裡，即使存在壞結果的風險，選擇 A 的整體效益期望值 (${eA.toFixed(1)}) 仍高於 B (${eB.toFixed(1)})。這就是此時此刻你最理性的決策，大膽去做，並對結果負責。`;
        // Favor left (A)
        let diff = eA - eB;
        let p = 50 - (diff / (Math.abs(eA) + Math.abs(eB) + 0.1) * 50);
        percentage = Math.max(10, p);
    } else if (eB > eA) {
        winnerText.innerHTML = `你的理性選擇是：<span class="highlight">選擇 B</span>`;
        winnerDesc.textContent = `在你的主觀算計裡，維持選擇 B 的期望值 (${eB.toFixed(1)}) 更穩健或更能避免讓你難以承受的痛苦。不必覺得自己沒勇氣，這只是忠於你現有資訊邊界的最優解。`;
        // Favor right (B)
        let diff = eB - eA;
        let p = 50 + (diff / (Math.abs(eA) + Math.abs(eB) + 0.1) * 50);
        percentage = Math.min(90, p);
    } else {
        winnerText.innerHTML = `兩個選擇<span class="highlight">同樣理性</span>`;
        winnerDesc.textContent = `這兩個選擇在你心中的期望值完全依樣 (${eA.toFixed(1)})。拋硬幣吧，因為選哪個都一樣值得。`;
        percentage = 50;
    }

    meterFill.style.width = `${percentage}%`;
}
