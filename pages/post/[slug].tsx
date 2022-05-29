import { GetStaticProps } from "next";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity"
import { Post } from '../../typings';
import PortableText from 'react-portable-text';
import { useForm, SubmitHandler } from 'react-hook-form'
import { useState } from "react";

interface PropsData {
    post: Post;
  }

interface FormData{
    _id: string;
    name: string;
    email: string;
    comment: string;
}

function Post({ post }: PropsData) {

    console.log(post.comments)

    const [submitted, setSubmitted] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

    const onSubmit:SubmitHandler<FormData> = (data) => {
        fetch('/api/createComment', {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(() => {
            console.log(data)
            setSubmitted(true)
        }).catch((err) => {
            console.log(err)
            setSubmitted(false)
        })
    }

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
                                <h2 className="text-xl font-bold my-5" {...props} />
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
        <hr className="max-w-lg mt-5 mx-auto border border-yellow-500" />

        {submitted ? (
            <div className="flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto">
                <h3 className="text-3xl font-bold">
                    Thank you for submitting your comment!
                </h3>
                <p>
                    Once it has been approved, it will appear below!
                </p>
                <button className="bg-white text-yellow-500 font-bold rounded p-3 mt-3" onClick={() => setSubmitted(false)}>Leave an other comment</button>
            </div>
        ) : (
            <form className="flex flex-col p-5 max-w-2xl mx-auto mb-10" onSubmit={handleSubmit(onSubmit)}> 
            <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
            <h4 className="text-3xl font-bold">Leave a comment below</h4>

                <input type="hidden" value={post._id} {...register("_id")} />

                <label htmlFor="" className="block mb-5">
                    <span className="text-gray-700">Name</span>
                    <input {...register("name", {required: true})} className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring" type="text" />
                </label>
                <label htmlFor="" className="block mb-5">
                    <span className="text-gray-700">Email</span>
                    <input {...register("email", {required: true})} className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring" type="text" />
                </label>
                <label htmlFor="" className="block mb-5">
                    <span className="text-gray-700">Comment</span>
                    <textarea {...register("comment", {required: true})} className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring" rows={4}></textarea>
                </label>
                <div className="flex flex-col p-5">
                    {errors.name && <span className="text-red-500">- The Name Field is required</span>}
                    {errors.comment && <span className="text-red-500">- The Comment Field is required</span>}
                    {errors.email && <span className="text-red-500">- The Email Field is required</span>}
                </div>
                <input type="submit" className="shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer" />
            </form>
        )}

        <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-x-2">
            <h3 className="text-4xl pb-3">Comments</h3>
            <hr className="pb-3" />
            {post.comments.map((comment) => (
                <div key={comment._id}>
                    <p className="mb-3"><span className="text-yellow-500">{comment.name}:</span> {comment.comment}</p>
                </div>
            ))}
        </div>

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