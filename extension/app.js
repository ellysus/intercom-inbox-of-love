// Query Ratings API
async function getRatings(appId, adminId) {
    const ratings = await fetch(`https://app.intercom.com/ember/conversation_ratings/list_unseen_first.json?app_id=${appId}&admin_id=${adminId}`)
    return ratings.json()
}

// Wait for the element to be loaded
function waitForElm(selector) {
    return new Promise(resolve => {
        setTimeout(function() { 
            return resolve(null);
        }, 10000);

        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector))
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    })
}

async function injectScript() {
    // Extracting Admin ID and App ID from URL
    let appId = window.location.href.match(/(?<=apps\/)\w{1,}[^/]|(?<=a\/inbox\/)\w{1,}[^/]/gm)[0]
    let adminId = window.location.href.match(/(?<=inbox\/inbox\/)\w{1,}[^/]|(?<=inbox\/admin\/)\w{1,}[^/]/gm)[0]

    // Fetching the unseen ratings from Intercom API
    const allRatings = await getRatings(appId, adminId)

    // Getting the panel element
    let leftPaneContents = await waitForElm('.inbox2__inbox-list-sidebar')
    // Creating the heart icon
    let heartDiv = document.createElement('div')
    heartDiv.innerHTML = `
        <span class="inbox__inbox-of-love__icon cursor-pointer">
            <svg class="interface-icon o__standard o__standard__relationship" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <path d="M1.321 5.5c0-2.304 1.446-3.357 3.321-3.357.679 0 1.446.339 2.321 1.036.393.304.732.643 1.036 1 .625-.696 1.321-1.268 2.125-1.696a2.472 2.472 0 0 1 1.232-.339c1.857 0 3.321 1 3.321 3.357 0 .696-.286 1.482-.839 2.339a6.336 6.336 0 0 1-.839 1l-5 5.018-5-5.018a6.284 6.284 0 0 1-1.411-2.071 3.04 3.04 0 0 1-.268-1.268z"></path>
            </svg>
        </span>

        <div class="overlay z__2 inbox__inbox-of-love__popover u__hidden">
        </div>
    `

    heartDiv.classList.add('absolute', "right-0", "bottom-0", "flex", "flex-row", "justify-end", "px-6", 'py-5')
    heartDiv.id = "inbox-of-love"
    leftPaneContents.appendChild(heartDiv)

    // Handling the click event on the heart icon
    heartDiv.addEventListener('click', () => {
        // get a random unseen rating
        let randomRating = allRatings[Math.floor(Math.random() * allRatings.length)]

        // date parsing and formatting
        let date = new Date(randomRating.updated_at)
        let diff = Date.now() - date
        let calcDiff = Math.abs(diff) / 36e5
        let displayDiff = ""

        if (calcDiff < 24) { displayDiff = Math.round(calcDiff) + "h ago" }
        else { displayDiff = Math.round(calcDiff / 24) + "d ago" }

        // generate the HTML for the popover
        let popoverHTML = `
        <a href="/a/apps/${appId}/inbox/conversation/${randomRating.conversation_id}" class="inbox__inbox-of-love__link-to-conversation">
            <div class="inbox__inbox-of-love__ratings">
                <div class="flex-none flex flex-col">
                    <div class="flex-none flex flex-row">
                        <div class="inbox__inbox-of-love__avatar">
                        <span id="ember3477" class="avatar o__m ember-view"><span class="avatar__media" style="background-color: #${randomRating.user.avatar.color};" role="img" aria-label="${randomRating.user.display_as}">${randomRating.user.avatar.initials}</span><span class="avatar__badge o__m"></span></span>
                        </div>
                        <div class="inbox__inbox-of-love__rating-user-and-companies">
                        <div>
                            <span class="inbox__inbox-of-love__rating-user t__solo-link">${randomRating.user.display_as}</span>
                            rated you
                            <div class="inbox__inbox-of-love__rating-emoji o__inline-small conversation-rating__rating-${randomRating.rating_index}"></div>
                        </div>
                        <div class="inline-flex max-w-full inbox__inbox-of-love__rating-company">${displayDiff}</div>
                        </div>
                    </div>
                    <div class="t__left inbox__inbox-of-love__rating-remark u__padt__10">
                        ${randomRating.remark || ""}
                    </div>
                </div>
            </div>
            </a>
        `

        // get the popover element and set HTML
        let popover = document.querySelector('.inbox__inbox-of-love__popover')
        popover.innerHTML = popoverHTML
        popover.classList.remove('u__hidden')
        fireConfetti()


        // Mark the rating as seen (getting 401 error and I don't want to get into auth API security right now)
    /*     fetch(`https://app.intercom.com/ember/conversation_ratings/mark_as_seen/${randomRating.id}`, {
            method: 'PUT',
            body: JSON.stringify({
            'app_id': 'd97m90f7'
            })
        }) */
    })

    // Handling the click event outside the popover
    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('inbox__inbox-of-love__popover') && !document.querySelector('.inbox__inbox-of-love__icon').contains(e.target)) {
            document.querySelector('.inbox__inbox-of-love__popover').classList.add('u__hidden')
        }
    })
}

async function main() {
    console.log('Searching for new inbox...')
    const newInboxDetect = await waitForElm('a[href*="inbox_2_opt_out"]')

    if (window.location.href.indexOf("intercom") > -1 && window.location.href.indexOf("inbox") > -1) {
        if (newInboxDetect) {
            console.log('New inbox detected, starting script...');
            dpr = window.devicePixelRatio || 1
            let canvas = document.createElement('canvas')
            canvas.id = "confetti-canvas"
            canvas.width = window.innerWidth * dpr
            canvas.height = window.innerHeight * dpr
            canvas.style.width = window.innerWidth + 'px'
            canvas.style.height = window.innerHeight + 'px'
            document.body.appendChild(canvas)
            injectScript()
        } else {
            console.log('No new inbox detected, exiting...');
        }
    }
}

main()