class Adm < Formula
  desc "ADM developer CLI"
  homepage "https://github.com/your-org/adm"
  url "https://github.com/your-org/adm/releases/download/v0.1.0/adm.tar.gz"
  sha256 "TODO:replace_with_real_sha256"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/adm"
  end
end
