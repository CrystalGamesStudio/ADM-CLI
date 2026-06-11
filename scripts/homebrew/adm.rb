class Adm < Formula
  desc "ADM developer CLI — environment setup, GitHub integration, and AI-powered assistant"
  homepage "https://github.com/CrystalGamesStudio/ADM-CLI"
  url "https://registry.npmjs.org/@crystalgames/adm/-/adm-0.2.1.tgz"
  sha256 "5d1a8be9ee71e8fb012014396d4c62d5567c6c34d464358c359a458123cc748d"
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
