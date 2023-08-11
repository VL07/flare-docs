export const onRequestPost = async (context) => {
    console.log(JSON.stringify(context.request));
    const { searchParams } = new URL(context.request.url);
    return new Response(JSON.stringify({
        search: searchParams.get("search")
    }));
};
