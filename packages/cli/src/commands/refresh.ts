import { DisplayDevice, getPageRpi, BrowserPage, Logger } from '@lukedevops/core';
import { getDevice } from '../deviceFactory';
import { Command } from './command';
import { DisplayArgs } from './display';

export interface RefreshArgs extends DisplayArgs {
    interval?: number;
    loops?: number;
}

interface LoopArgs {
    browserPage?: BrowserPage
    refreshArgs: RefreshArgs
    displayDevice?: DisplayDevice
}

export class RefreshCommand implements Command<RefreshArgs> {
    private displayDevice?: DisplayDevice;
    private browserPage?: BrowserPage;

    constructor(private readonly logger: Logger) {}

    public async execute(refreshArgs: RefreshArgs) {
        this.logger.log(`Connecting to ${refreshArgs.deviceType} screen`);
        this.displayDevice = await getDevice(refreshArgs.deviceType, refreshArgs.orientation, refreshArgs.colorMode);
        this.displayDevice.connect();
        this.logger.log(`Connected`);
        this.browserPage = await getPageRpi(this.displayDevice.width, this.displayDevice.height, this.logger);
        const loopArgs = {browserPage: this.browserPage, refreshArgs, displayDevice: this.displayDevice}
        this.loopExecutor(loopArgs)
    }

    public async dispose() {
        this.logger.log('Powering off display and exiting...');
        this.displayDevice?.disconnect();
        await this.browserPage?.close();
    }

    private async loopCallback(args: LoopArgs) {
        const imgOfUrl = await args.browserPage?.screenshot(args.refreshArgs.url, {
            delay: args.refreshArgs.screenshotDelay,
            username: args.refreshArgs.username,
            password: args.refreshArgs.password,
        });
        this.logger.log('Waking up display');
        args.displayDevice?.wake();
        this.logger.log(`Displaying ${args.refreshArgs.url}`);
        const dither = args.refreshArgs.dither
        if (imgOfUrl) await args.displayDevice?.displayPng(imgOfUrl, { dither });
        args.displayDevice?.sleep();
        this.logger.log('Putting display into low power mode');
        await this.sleep(args.refreshArgs.interval);
    }

    private async loopExecutor(args: LoopArgs) {
        // something wrong with the loops - when loops is undefined it makes one attempt then goes to dispose. 
        const loops = args.refreshArgs.loops
        if (loops === undefined) {
            for (let i = 0; i < 6; i++) {
                await this.loopCallback(args)
            }
        } 
        else if (loops > 0) {
            for (let i =0; i < loops; i++) {
                await this.loopCallback(args)
            }
        }
        else {
            while (true) {
               await this.loopCallback(args)
            }
        }
    }

    private sleep(seconds: number = 600) {
        if (seconds > 60) {
            const min = Math.floor(seconds / 60);
            const remainingSec = (seconds % 60).toString().padStart(2, '0');
            this.logger.log(`Next refresh in ${min}m:${remainingSec}s`);
        } else {
            this.logger.log(`Next refresh in ${seconds}s`);
        }
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
}
