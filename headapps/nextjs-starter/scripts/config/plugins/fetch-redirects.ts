import { JssConfig } from 'lib/config';
import { ConfigPlugin } from '..';
import { createGraphQLClientFactory } from 'lib/graphql-client-factory/create';
import { GraphQLRedirectsService, RedirectInfo } from '@sitecore-jss/sitecore-jss/site';

type Redirect = {
    source: string;
    destination: string;
    permanent?: boolean;
};

class FetchRedirectsPlugin implements ConfigPlugin {    
    order = 200;

    async exec(config: JssConfig) {
        const siteName = config.sitecoreSiteName;
        if (!siteName || siteName === '') {
            throw new Error('[FetchRedirectsPlugin] No site name.');
        }

        const redirectsService = new GraphQLRedirectsService({
            clientFactory: createGraphQLClientFactory(config),
        });

        const redirects = await redirectsService.fetchRedirects(siteName);

        const redirectEntries = this.buildRedirectEntries(
            redirects.filter(x => x.redirectType.toLowerCase().startsWith('redirect')));
        
        const transferEntries = this.buildRedirectEntries(
            redirects.filter(x => x.redirectType.toLowerCase().startsWith('server')));

        for (var transfer of transferEntries) {
            if (transfer.source.endsWith('/')) {
                transfer.source = transfer.source.substring(0, transfer.source.length - 1);
            }
        }

        return Object.assign({}, config, {
            redirects: JSON.stringify(redirectEntries),
            transfers: JSON.stringify(transferEntries),
        });
    }

    private buildRedirectEntries(redirects: RedirectInfo[]): Redirect[] {
        return redirects.map(x => {
            var permanent: boolean | undefined = undefined;
            if (x.redirectType.toUpperCase() === 'REDIRECT_301') {
                permanent = true;
            } else if (x.redirectType.toUpperCase() === 'REDIRECT_302') {
                permanent = false;
            }

            return {
                source: x.pattern,
                destination: x.target,
                permanent,
            };
        });
    }
}

export const fetchRedirectsPlugin = new FetchRedirectsPlugin();
