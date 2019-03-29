// min and max prod numbers
const MIN_PROD = 0;
const MAX_PROD = 14;

// min and max upgrade numbers
const MIN_UPG = 0;
const MAX_UPG = 519;

// constant for deciding whether the new product is too expensive
const MAX_PRICE_COOKIE_RATIO = 5;

function getProductElem(prodNum) {
   return document.getElementById('product'+prodNum);
}

function getUpgradeElem(upgNum) {
    return document.getElementById('upgrade'+upgNum);
}

// returns Game.ObjectsById[prodNum]
function getGameObject(prodNum) {
   return Game.ObjectsById[prodNum];
}

// returns true if the product element is enabled
function isProductEnabled(prodNum) {
    const p = getProductElem(prodNum);
    return p && p.className.includes('enabled');
}

function isProductUnlocked(prodNum) {
    const p = getProductElem(prodNum);
    return p && p.className.includes('unlocked');
}

// returns true if the upgrade is unlocked and can be bought
function isUpgradeEnabled(upgNum) {
    const u = Game.UpgradesById[upgNum];
    return u && u.unlocked && !u.bought && u.basePrice < Game.cookies;
}

// find first product which is unlocked but we don't own it
function findFirstUnlockedNewProduct() {
   for (let i = MIN_PROD; i <= MAX_PROD; i++) {
       const p = getProductElem(i);
       if (p.className.includes('unlocked') && getGameObject(i).amount == 0) {
           return i;
       }
   }

   return -1;
}

// clicks on product element
function buyProduct(prodNum) {
    const p = getProductElem(prodNum);
    p.click();
}

// call's game buy function over upgrade object
function buyUpgrade(upgNum) {
    const u = Game.UpgradesById[upgNum];
    u.buy();
}

// calculates price per 1 cookie
// the lower the better
function calculateProductCookiePrice(prodNum) {
    const p = getGameObject(prodNum);
    return p.price / p.cps(p);
}

/**
 * Iterates over all unlocked items and decides which has the minimal price/cps ratio.
 * May return product which is not enabled so it should be checked before buying.
 *
 * @returns {number} Number of product with the best price/cps ratio.
 */
function findBestProduct() {
    let minCookiePrice = -1;
    let prodNum = -1;
    for(let i = MIN_PROD; i <= MAX_PROD; i++) {
        if (isProductUnlocked(i)) {
            const price = calculateProductCookiePrice(i);
            if (price < minCookiePrice || minCookiePrice === -1) {
                 minCookiePrice = price;
                 prodNum = i;
            } 
        }
    }

    return prodNum;
}

// returns upgrade num of the upgrade which is 'the best'
// currently, 'the best' = the first available but it might change in the future
function findBestUpgrade() {
    for (let i = MIN_UPG; i <= MAX_UPG; i++) {
        if (isUpgradeEnabled(i)) {
            return i;
        }
    }

    return -1;
}

// checks if gold cookie is displayed and clicks on it.
function checkGoldCookie() {
    if (!Game.shimmers) {
        return;
    }

    // find gold cookie in active shimmers
    for (let i = 0; i < Game.shimmers.length; i++) {
        let shimmer = Game.shimmers[i];
        if (shimmer.type === "golden") {
            console.info('Golden cookie!');

            // click on the elemnt - note that this might collide with other shimmers in the future
            const shimm = document.getElementById('shimmers');
            if (shimm && shimm.childNodes.length > 0) {
                shimm.childNodes[0].click();
            }
            break;
        }
    }
}

/**
 * Decides whether the product.price / Game.cookies ratio is too big.
 * If the ratio is greater than MAX_PRICE_COOKIE_RATIO, true is returned.
 *
 * @param prodNum True if the product is too expensive.
 */
function isProductTooExpensive(prodNum) {
    return (getGameObject(prodNum).price / Game.cookies) > MAX_PRICE_COOKIE_RATIO;
}


// bot logic
let waitingForBestProd = false;
let bestProd = -1;
gameBotLoop = function() {
    let bigCookie = document.getElementById("bigCookie");
    if(!bigCookie) {
        console.info("No big cookie...");
        return;
    }

    bigCookie.click();

    if(!Game || !Game.ObjectsById) {
        console.info('No game object...');
        return;
    }

    // check golden cookie
    checkGoldCookie();


    // check if we can buy the best product
    // and if not, check if it's not too expensive
    // if we can't buy the best product but it's not too expensive
    // just wait for it
    if (!waitingForBestProd) {
        // find best product
        bestProd = findBestProduct();

        // findBestProduct() should always return value >= 0, but check it just in case
        if (bestProd !== -1) {
            console.info('Found best product ' + bestProd);

            const tooExpensive = isProductTooExpensive(bestProd);

            if (tooExpensive) {
                console.info('Best product ' + bestProd + ' is too expensive.');


            // product is not too expensive check if it can be bought
            // and if not, wait for it
            } else {
                if (isProductEnabled(bestProd)) {
                    console.info('Buying product ' + bestProd);
                    buyProduct(bestProd)
                    waitingForBestProd = false;
                } else {
                    console.info('Waiting for product ' + bestProd);
                    waitingForBestProd = true;
                }
            }
        }

    // we're waiting for best product -> check if we can buy it
    } else {
        if (isProductEnabled(bestProd)) {
            console.info('Buying product ' + bestProd);
            buyProduct(bestProd);
            waitingForBestProd = false;
        } else {
            // keep waiting ...
            return;
        }
    }

    // check best upgrade
    const bestUpg = findBestUpgrade();
    if (bestUpg >= 0) {
        console.info('Found best upgrade ' + bestUpg + ':' + Game.UpgradesById[bestUpg].name+ '!');
        buyUpgrade(bestUpg);
    }
}

// bootstrap
window.addEventListener("load", function() {
    let bigCookie = document.getElementById("bigCookie");

    if (!bigCookie) {
	  console.info("Big cookie not found...");
	} else {
	   console.info("Cookie found!");
	   setInterval(gameBotLoop, 500);
	}
}, false);
