class Adm < Formula
  desc "ADM developer CLI — environment setup, GitHub integration, and AI-powered assistant"
  homepage "https://github.com/CrystalGamesStudio/ADM-CLI"
  url "https://registry.npmjs.org/@crystalgames/adm/-/adm-0.1.9.tgz"
  sha256 "c02391c2a84f5d4654836b8f061ac6902d414a7d261a4fdb0f1f2090f3053d9c"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/adm --version")
  end
end
