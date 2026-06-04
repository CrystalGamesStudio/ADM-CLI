class Adm < Formula
  desc "ADM developer CLI — environment setup, GitHub integration, and AI-powered assistant"
  homepage "https://github.com/CrystalGamesStudio/ADM-CLI"
  url "https://registry.npmjs.org/@crystalgames/adm/-/adm-0.1.0.tgz"
  sha256 "PLACEHOLDER_RUN_sha256_AFTER_NPM_PUBLISH"
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
