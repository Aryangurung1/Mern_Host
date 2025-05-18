export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col">
      

      <main className="flex-grow">
        {/* Page Title */}
        <div className="text-center max-w-2xl mx-auto px-4 pt-12 pb-8">
          <h1 className="text-2xl font-semibold mb-2">Real Estate Insights & Tips</h1>
          <p className="text-gray-600">Stay informed with the latest market trends and expert advice</p>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Featured Article */}
              <div className="mb-12">
                <div className="relative aspect-[16/9] mb-4">
                  <img
                    src="../../public/house.jpeg"
                    alt="Modern luxury house"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 text-sm rounded-full">Market Trends</span>
                  <span className="text-gray-500 text-sm">5 min read</span>
                </div>

                <h2 className="text-xl font-semibold mb-2">2024 Real Estate Market Forecast: What to Expect</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Get insights into the upcoming real estate trends and market predictions for 2024. Learn about price
                  movements, interest rates, and investment opportunities.
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/placeholder.svg?height=32&width=32"
                      alt="Sarah Johnson"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium text-sm">Sarah Johnson</p>
                      <p className="text-sm text-gray-500">March 15, 2024</p>
                    </div>
                  </div>
                  <href href="#" className="text-sm font-medium">
                    Read More
                  </href>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-8 mb-8 border-b">
                {["All", "Market Trends", "Buying Tips", "Selling Guide", "Investment"].map((tab, index) => (
                  <button
                    key={tab}
                    className={`pb-2 text-sm ${
                      index === 0 ? "border-b-2 border-black font-medium" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Article Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Article 1 */}
                <article>
                  <div className="relative aspect-video mb-4">
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt="Luxury home"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 text-xs rounded-full">Buying Tips</span>
                    <span className="text-gray-500 text-xs">3 min read</span>
                  </div>
                  <h3 className="font-medium mb-2">How to Choose the Perfect Neighborhood</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Essential factors to consider when selecting your ideal neighborhood...
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">March 8, 2024</p>
                    <href href="#" className="text-sm font-medium">
                      Read More
                    </href>
                  </div>
                </article>

                {/* Article 2 */}
                <article>
                  <div className="relative aspect-video mb-4">
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt="Modern kitchen"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 text-xs rounded-full">Home Improvement</span>
                    <span className="text-gray-500 text-xs">4 min read</span>
                  </div>
                  <h3 className="font-medium mb-2">Kitchen Renovation Tips for 2024</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Latest trends and practical advice for your kitchen renovation project...
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">March 5, 2024</p>
                    <href href="#" className="text-sm font-medium">
                      Read More
                    </href>
                  </div>
                </article>

                {/* Article 3 */}
                <article>
                  <div className="relative aspect-video mb-4">
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt="Investment meeting"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 text-xs rounded-full">Investment</span>
                    <span className="text-gray-500 text-xs">6 min read</span>
                  </div>
                  <h3 className="font-medium mb-2">Real Estate Investment Strategies</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Expert advice on building a successful real estate investment portfolio...
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">March 3, 2024</p>
                    <href href="#" className="text-sm font-medium">
                      Read More
                    </href>
                  </div>
                </article>
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mb-12">
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-black">Previous</button>
                <button className="px-3 py-1 text-sm bg-black text-white rounded">1</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-black">2</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-black">3</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-black">Next</button>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Popular Posts */}
              <div className="mb-8">
                <h3 className="font-semibold mb-4">Popular Posts</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src="/placeholder.svg?height=60&width=60"
                      alt="Interior design"
                      width={60}
                      height={60}
                      className="rounded object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-sm mb-1">Interior Design Trends for 2024</h4>
                      <p className="text-sm text-gray-500">March 12, 2024</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src="/placeholder.svg?height=60&width=60"
                      alt="First time buyers"
                      width={60}
                      height={60}
                      className="rounded object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-sm mb-1">First-Time Buyer's Guide</h4>
                      <p className="text-sm text-gray-500">March 10, 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div>
                <h3 className="font-semibold mb-2">Newsletter</h3>
                <p className="text-sm text-gray-600 mb-4">Get the latest real estate insights directly to your inbox</p>
                <form className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 text-sm border rounded"
                  />
                  <button type="submit" className="w-full px-4 py-2 bg-black text-white text-sm rounded">
                    Subscribe
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

