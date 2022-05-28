import { GetStaticProps } from "next";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity"
import { Post } from '../../typings';
import PortableText from 'react-portable-text';

interface PropsData {
    post: Post;
  }

function Post({ post }: PropsData) {
  return (
    <main>
        <Header />

        <img className="w-full h-40 object-cover" src={urlFor(post.mainImage).url()!} alt="" />
        <article className="max-w-3xl mx-auto p-5">
            <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
            <h2 className="text-xl font-light text-gray-500 mb-2">{post.description}</h2>

            <div className="flex items-center gap-3 border border-x-0 py-3 my-5">
                <img className="h-10 w-10 rounded-full" src={urlFor(post.author.image).url()!} alt="" />
                <p className="font-extralight text-sm">
                    Blog post by <span className="text-green-600">{post.author.name}</span><br />
                    <span className="text-gray-400">Published at {new Date(post._createdAt).toLocaleString()}</span>
                </p>
            </div>

            

            <div className="mt-10">
                <PortableText
                    content={post.body}
                    dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
                    projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
                    serializers={
                        {
                            h1: (props: any) => (
                                <h1 className="text-2xl font-bold mt-5" {...props} />
                            ),
                            h2: (props: any) => (
                                <h2 className="text-xl font-bold mt-5" {...props} />
                            ),
                            li: ({children}: any) => (
                                <li className="ml-4 list-disc">{children}</li>
                            ),
                            link: ({href, children}: any) => (
                                <a href={href} className="text-blue-500 hover:underline">
                                    {children}
                                </a>
                            )
                        }
                    }
                />
            </div>
        </article>
    </main>
  )
}

export default Post;

export const getStaticPaths = async () => {
    const query = `
    *[_type == "post"]{
      _id,
      slug {
          current
      }
    }
  `;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
      params: {
          slug: post.slug.current
      }
  }))

  return {
      paths,
      fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const query = `
        *[_type == "post" && slug.current == $slug][0]{
            _id,
            _createdAt,
            title,
            author -> {
                name,
                image
            },
            'comments': *[
                _type == "comment" &&
                post._ref == ^._id &&
                approved == true],
            description,
            mainImage,
            slug,
            body
        }
    `;

    const post = await sanityClient.fetch(query, {
        slug: params?.slug,
    });

    if(!post) {
        return {
            notFound: true
        }
    }

    return {
        props: {
            post
        },
        revalidate: 60
    }
}