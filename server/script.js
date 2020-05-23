const puppeteer = require('puppeteer');

const script = async (username) => {
    const browser = await puppeteer.launch({ 
        args: [
            '--incognito',
        ],
        headless: false 
    });
    const page = await browser.newPage();
    await page.goto('https://www.instagram.com/accounts/login', { waitUntil: "networkidle2" });
    await page.type('input[name=username]', 'jessiejames12345678', { delay: 20 });
    await page.type('input[name=password]', 'adminpassword1', { delay: 20 });
    await page.click('button[type=submit]', { delay: 20 });
    await page.waitFor(5000)

    const notifyBtns = await page.$x("//button[contains(text(), 'Not Now')]");
    if (notifyBtns.length > 0) {
        await notifyBtns[0].click();
    } else {
        console.log("No notification buttons to click.");
    }
    await page.goto(`https://www.instagram.com/${username}`, { waitUntil: "networkidle2" });
    // await page.click('a[href="/rmbhh/"]');
    await page.waitFor(2000);
    const followersBtn = await page.$('div[id=react-root] > section > main > div > header > section > ul > li:nth-child(2) > a');
    await followersBtn.evaluate(btn => btn.click());

    await page.waitFor(3000);
    const followersDialog = 'div[role="dialog"] > div:nth-child(2)';
    await page.waitForSelector('div[role="dialog"] > div:nth-child(2) > ul');
    await scrollDown(followersDialog, page);

    console.log("getting followers");
    const list1 = await page.$$('div[role="dialog"] > div:nth-child(2) > ul > div > li > div > div > div:nth-child(2) > div > a');
    let avatarPaths = [
        'div[role="dialog"] > div:nth-child(2) > ul > div > li > div > div > div > a > img',
        'div[role="dialog"] > div:nth-child(2) > ul > div > li > div > div > div > span > img'
    ];
    const pics1 = await avatarPaths.reduce(async (accProm, path) => {
        const acc = await accProm;
        const arr = await page.$$eval(path, res => {
            return res.map(pic => {
                const alt = pic.getAttribute('alt');
                const strings = alt.split(/(['])/g);
                return {
                    username: strings[0],
                    avatar: pic.getAttribute('src')
                }
            })
        });
        return acc.concat([...arr]);
    }, Promise.resolve([]));
    const followers = await Promise.all(list1.map(async item => {
        const username = await (await item.getProperty('innerText')).jsonValue();
        const pic = pics1.find(p => p.username === username) || { avatar: "" };
        return {
            avatar: await pic.avatar,
            username
        }
    }));

    const closeBtn = await page.$('div[role="dialog"] > div > div > div:nth-child(3) > button');
    await closeBtn.evaluate(btn => btn.click());

    const followingBtn = await page.$('div[id=react-root] > section > main > div > header > section > ul > li:nth-child(3) > a');
    await followingBtn.evaluate(btn => btn.click());
    
    await page.waitFor(3000);
    const followingDialog = 'div[role="dialog"] > div:nth-child(3)';
    await page.waitForSelector('div[role="dialog"] > div:nth-child(3) > ul');
    await scrollDown(followingDialog, page);

    console.log("getting following");
    const list2 = await page.$$('div[role="dialog"] > div:nth-child(3) > ul > div > li > div > div > div:nth-child(2) > div > a');
    await page.waitForSelector('div[role="dialog"] > div:nth-child(3) > ul > div > li > div > div > div > a > img');
    avatarPaths = [
        'div[role="dialog"] > div:nth-child(3) > ul > div > li > div > div > div > a > img',
        'div[role="dialog"] > div:nth-child(3) > ul > div > li > div > div > div > span > img'
    ]
    const pics2 = await avatarPaths.reduce(async (accProm, path) => {
        const acc = await accProm;
        const arr = await page.$$eval(path, res => {
            return res.map(pic => {
                const alt = pic.getAttribute('alt');
                const strings = alt.split(/[']/g);
                return {
                    username: strings[0],
                    avatar: pic.getAttribute('src')
                }
            })
        });
        return acc.concat([...arr]);
    }, Promise.resolve([]));
    const following = await Promise.all(list2.map(async item => {
        const username = await (await item.getProperty('innerText')).jsonValue()
        const pic = pics2.find(p => p.username === username) || { avatar: "" };
        return {
            avatar: await pic.avatar,
            username
        };
    }));

    const followerCnt = followers.length;
    const followingCnt = following.length;
    console.log(`followers: ${followerCnt}`);
    console.log(`following: ${followingCnt}`);

    const notFollowingYou = following.filter(item => !followers.find(f => f.username === item.username));
    const notFollowingThem = followers.filter(item => !following.find(f => f.username === item.username));
    await browser.close();
    return { 
        followerCnt, 
        followingCnt, 
        notFollowingYou, 
        notFollowingThem, 
        followers, 
        following
    };
};

async function scrollDown(selector, page) {
    await page.evaluate(async selector => {
        const section = document.querySelector(selector);
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 100;
            const timer = setInterval(() => {
                var scrollHeight = section.scrollHeight;
                section.scrollTop = 100000000;
                totalHeight += distance;

                if (totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }, selector);
}

module.exports = { script };