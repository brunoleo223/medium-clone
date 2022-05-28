import type { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/Header';
import { sanityClient, urlFor } from "../sanity"
import { Post } from '../typings';

interface PropsData {
  posts: [Post]
}

function Home({ posts }: PropsData) {

  console.log(posts)
  
  return ( 
    <div className="max-w-7xl mx-auto">
      <Head>
        <title>Medium Blog</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className='flex justify-between items-center bg-yellow-400 border-y border-black py-10 lg:p-0'>
        <div className='px-10 space-y-5'>
          <h1 className='text-6xl max-w-xl font-serif'>
            <span className='underline decoration-black decoration-4'>Medium</span> is a place to write, read and connect
          </h1>
          <h2>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vel vero voluptatibus in eligendi necessitatibus velit perspiciatis</h2>
        </div>
        <div>
          <img className='hidden md:inline-flex h-32 lg:h-full' src="https://iconape.com/wp-content/png_logo_vector/medium-m.png" alt="" />
        </div>
      </div>
    </div>
  )
}

export default Home;

export const getServerSideProps = async () => {
  const query = `
    *[_type == "post"]{
      _id,
      title,
      author -> {
        name,
        image
      },
      description,
      mainImage,
      slug
    }
  `;

  const posts = await sanityClient.fetch(query);

  return {
    props: {
      posts
    }
  }
};
