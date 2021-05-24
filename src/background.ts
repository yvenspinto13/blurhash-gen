import { encode } from 'blurhash';

chrome.runtime.onInstalled.addListener(() => {
    console.log('registerd');
    chrome.contextMenus.create({
        title: 'Generate Blur Hash',
        id: 'blur-gen-menu', // you'll use this in the handler function to identify this context menu item
        contexts: ['image'],
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === 'blur-gen-menu') { // here's where you'll need the ID
            // do something
            sendBadge('');
            try {
                const blurHash = await encodeImageToBlurhash(info.srcUrl);
                chrome.storage.sync.set({ info: blurHash }, () => { sendBadge('Ready'); });
            } catch (error) {
                console.log(error);
                sendBadge('Error');
            }
        }
    });
});

const sendBadge = text => chrome.browserAction.setBadgeText({ text });

const loadCanvasImage = async dataUrl =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { console.log('resize done'); resolve(img); };
        img.onerror = (...args) => reject(args);
        img.src = dataUrl;
    });

const loadImage = async src =>
    new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        const img = new Image();
        img.onload = async () => {
            URL.revokeObjectURL(src);
            console.log('initial load', img.width);
            if (img.width > 256) {
                // set size proportional to image
                canvas.height = canvas.width * (img.height / img.width);

                // step 1 - resize to 50%
                const oc = document.createElement('canvas');
                const octx = oc.getContext('2d');

                oc.width = img.width * 0.5;
                oc.height = img.height * 0.5;
                octx.drawImage(img, 0, 0, oc.width, oc.height);

                // step 2
                octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

                // step 3, resize to final size
                ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
                    0, 0, canvas.width, canvas.height);

                resolve(await loadCanvasImage(canvas.toDataURL()));
            }
            resolve(img);
        };
        img.onerror = (...args) => reject(args);
        img.src = src;
    });

const getImageData = image => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height);
};

const encodeImageToBlurhash = async imageUrl => {
    const blob = await ((await fetch('https://powerful-eyrie-42191.herokuapp.com/' + imageUrl)).blob());
    const image = await loadImage(URL.createObjectURL(blob));
    const imageData = getImageData(image);
    return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};
