declare module 'get-image-colors' {
    interface Color {
        hex(): string
        rgb(): number[]
        hsl(): number[]
    }

    function getColors(buffer: Buffer, type: string): Promise<Color[]>
    export default getColors
}
