/** Source-composite blink from the authored assembly viewer; apply before the common pose warp. */
export function drawRegisteredPortraitBlink(context, eyes, blink) {
    if (blink < .005)
        return;
    for (const eye of eyes) {
        const [x0, y0, x1, y1] = eye.bounds, width = x1 - x0, height = y1 - y0;
        context.drawImage(eye.base, x0, y0, width, height, x0, y0, width, height);
        if (blink >= .995) {
            context.drawImage(eye.closed, x0, y0, width, height, x0, y0, width, height);
            continue;
        }
        const stage = eye.stage.getContext('2d');
        stage.clearRect(0, 0, width, height);
        stage.drawImage(eye.open, x0, y0, width, height, 0, 0, width, height);
        const scale = Math.max(.03, 1 - blink * .97);
        if (eye.blinkAxis) {
            const [[ax, ay], [bx, by]] = eye.blinkAxis;
            const slope = (by - ay) / (bx - ax), intercept = ay - slope * ax;
            const blend = Math.max(0, (blink - .85) / .15);
            context.save();
            context.globalAlpha = 1 - blend;
            context.transform(1, slope * (1 - scale), 0, scale, 0, intercept * (1 - scale));
            context.drawImage(eye.stage, x0, y0, width, height);
            context.restore();
            if (blend > 0) {
                context.save();
                context.globalAlpha = blend;
                context.drawImage(eye.closed, x0, y0, width, height, x0, y0, width, height);
                context.restore();
            }
            continue;
        }
        context.drawImage(eye.stage, x0, eye.center[1] + (y0 - eye.center[1]) * scale, width, height * scale);
        if (blink > .65) {
            context.save();
            context.globalAlpha = (blink - .65) / .35;
            context.drawImage(eye.closed, x0, y0, width, height, x0, y0, width, height);
            context.restore();
        }
    }
}
