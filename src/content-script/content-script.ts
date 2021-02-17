import { Log } from '../shared/log';
import { Message } from '../shared/shared';
import { WriteBetter } from './writebetter';

const TAG = "content-script.ts"
let resizeTask: any = null;
const writeBetter = new WriteBetter();

const analyze = () => {
    const t1 = performance.now();
    const gdocSelector = '.kix-paginateddocumentplugin';
    writeBetter.analyze(gdocSelector);
    Log.debug(TAG, `Analyzed ${gdocSelector}  in ${Math.ceil(performance.now() - t1)}ms"`);
}

const init = () => {
    if (!writeBetter.isGoogleDocs()) {
        Log.debug(TAG, "Invalid editor model");
        return;
    }

    // Automatically re-analyze doc every second.
    // TODO: needs a ways to stop this when plugin is disabled (though disabling not part of v1.).
    setInterval(analyze, 1000);

    // When window is resized, force re-analyze doc. clear caches how?
    window.addEventListener('resize', () => {
        if (resizeTask !== null) {
            window.clearTimeout(resizeTask);
        }

        resizeTask = setTimeout(() => {
            resizeTask = null;
            analyze();
        }, 1000);
    });
}

const onMessage = (msg: Message, _: chrome.runtime.MessageSender, callback: (response?: any) => void) => {
    console.debug('content-script received message: ', msg.type);
    if (msg.type === 'analyze_doc') {
        init();
        callback(true);
    } else if (msg.type === 'cleanup') {
        writeBetter.clear();
        window.removeEventListener('resize', resizeTask);
    }
}

chrome.runtime.onMessage.addListener(onMessage);

// Run the script once added to the doc and user enabled it.
init();