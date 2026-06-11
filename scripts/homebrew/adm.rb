class Adm < Formula
  desc "ADM developer CLI — environment setup, GitHub integration, and AI-powered assistant"
  homepage "https://github.com/CrystalGamesStudio/ADM-CLI"
  url "https://registry.npmjs.org/@crystalgames/adm/-/adm-0.2.3.tgz"
  sha256 "9a73db6cc9e9e4b5cd3dfdb466714c9c08ee2a7724918a8abc155618b2ef1d82"
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
