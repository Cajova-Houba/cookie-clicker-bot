// min and max prod numbers
const MIN_PROD = 0;
const MAX_PROD = 14;

// min and max upgrade numbers
const MIN_UPG = 0;
const MAX_UPG = 519;

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
    var p = getProductElem(prodNum);
    return p && p.className.includes('enabled');
}

// returns true if the upgrade is unlocked and can be bought
function isUpgradeEnabled(upgNum) {
    var u = Game.UpgradesById[upgNum];
    return u && u.unlocked && !u.bought && u.basePrice < Game.cookies;
}

// find first product which is unlocked but we don't own it
function findFirstUnlockedNewProduct() {
   for (var i = MIN_PROD; i <= MAX_PROD; i++) {
       var p = getProductElem(i);
       if (p.className.includes('unlocked') && getGameObject(i).amount == 0) {
           return i;
       }
   }

   return -1;
}

// clicks on product element
function buyProduct(prodNum) {
   var p = getProductElem(prodNum);
   p.click();
}

// call's game buy function over upgrade object
function buyUpgrade(upgNum) {
    var u = Game.UpgradesById[upgNum];
    u.buy();
}

// calculates price per 1 cookie
// the lower the better
function calculateProductCookiePrice(prodNum) {
   var p = getGameObject(prodNum);
   return p.price / p.cps(p);
}

// returns product num of the product with the lowest cookie price
function findBestProduct() {
    var minCookiePrice = -1;
    var prodNum = -1;
    for(var i = MIN_PROD; i <= MAX_PROD; i++) {
        if (isProductEnabled(i)) {
            price = calculateProductCookiePrice(i);
            if (price < minCookiePrice || minCookiePrice == -1) {
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
            shimm = document.getElementById('shimmers');
            if (shimm && shimm.childNodes.length > 0) {
                shimm.childNodes[1].click();
            }
            break;
        }
    }
}

// bot logic
var newProd = -1;
var waitingForNewProd = false;
gameBotLoop = function() {
    var bigCookie = document.getElementById("bigCookie");
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
    // checkGoldCookie();

    // find best product
    var bestProd = findBestProduct();

    // check if there's unlocked product which we don't own and if so wait for it
    if (!waitingForNewProd) {
        newProd = findFirstUnlockedNewProduct();

        // wait for new product only if some best product was found
        // if no best product was found, it's mos likely because bot doesn't have any money and
        // everything is disabled
        if (newProd != -1 && bestProd != -1) {
            // if new prod is found, check it's price, if it's better than the currently available
            // best product's one
            var newProdIsBetter= (calculateProductCookiePrice(newProd) < calculateProductCookiePrice(bestProd));

            // new product can be too expensive
            // if it cost more than 5*current cookies, ignore it
            var tooExpensive = (getGameObject(newProd).price / Game.cookies) > 5;

            if(newProdIsBetter) {
                if (tooExpensive) {
                    console.info('New product ' + newProd + ' is too expensive.');
                    newProd = -1;
                } else {
                    console.info('Waiting for product ' + newProd + ' because it\'s cheaper than '+bestProd);
                    waitingForNewProd = true;
                    return;
                }
            } else {
                newProd = -1;
            }
        }
    } else {
        // waiting for new product, if it's enabled, buy it
        if (isProductEnabled(newProd)) {
            buyProduct(newProd);
            waitingForNewProd = false;
            newProd = -1;
        } else {
            // product not enabled, keep waiting
            return;
        }
    }


    // otherwise just buy the best upgrade & product
    var bestUpg = findBestUpgrade();
    if (bestUpg >= 0) {
        console.info('Found best upgrade ' + bestUpg + ':' + Game.UpgradesById[bestUpg].name+ '!');
        buyUpgrade(bestUpg);
    }

    if (bestProd >= 0) {
        console.info('Found best product: '+bestProd+'!');
         buyProduct(bestProd);
     }
}

// bootstrap
window.addEventListener("load", function() {
	var bigCookie = document.getElementById("bigCookie");

	if (!bigCookie) {
	  console.info("Big cookie not found...");
	} else {
	   console.info("Cookie found!");
	   setInterval(gameBotLoop, 500);
	}
}, false);
