import { ColorMode, DisplayDevice, Orientation, Logger } from '@lukedevops/core';

export async function getDevice(
    deviceType: string,
    orientation?: Orientation,
    colorMode?: ColorMode,
): Promise<DisplayDevice> {
    const factory = deviceMap.get(deviceType);
    if (factory) {
        return await factory(orientation, colorMode);
    }
    throw new Error(`Device type ${deviceType} not recognized`);
}

const deviceMap = new Map<string, (orientation?: Orientation, colorMode?: ColorMode) => Promise<DisplayDevice>>([
    ['rpi-4in26', getRpi4In26]
]);



async function getRpi4In26(orientation?: Orientation, colorMode?: ColorMode, logger?: Logger): Promise<DisplayDevice> {
    try {
        logger?.log("Connecting...")
        const { Rpi4In26 } = await import('@lukedevops/rpi-4in26');
        return new Rpi4In26(orientation, colorMode);
    } catch (e) {
        throw new Error('Failed to import @epaperjs/rpi-4in26, make sure it is installed');
    }
}